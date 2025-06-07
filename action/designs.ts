"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import DesignModel from "@/models/Design";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";
import {
  AddDesignResponse,
  DeleteDesignResponse,
  GetDesignsResponse,
  Design,
} from "@/types/design";

export async function addDesign(
  formData: FormData
): Promise<AddDesignResponse> {
  try {
    await dbConnect();
    const name: string = formData.get("name") as string;
    const description: string = formData.get("description") as string;
    const price: number = parseFloat(formData.get("price") as string);
    const number_of_rooms: number = parseInt(
      formData.get("number_of_rooms") as string
    );
    const square_meters: number = parseInt(
      formData.get("square_meters") as string
    );
    const category: string = formData.get("category") as string;
    const images: File[] = formData.getAll("images") as File[];

    console.log("FormData received:", {
      name,
      description,
      price,
      number_of_rooms,
      square_meters,
      category,
      images: images.length,
    });

    if (
      !name ||
      !description ||
      !price ||
      !number_of_rooms ||
      !square_meters ||
      !category ||
      images.length === 0
    ) {
      console.error("Missing fields:", {
        name,
        description,
        price,
        number_of_rooms,
        square_meters,
        category,
        images,
      });
      return {
        success: false,
        error: "All fields are required, including category",
      };
    }

    if (isNaN(price) || price < 0) {
      return { success: false, error: "Invalid price" };
    }

    if (isNaN(number_of_rooms) || number_of_rooms < 1) {
      return { success: false, error: "Number of rooms must be at least 1" };
    }

    if (isNaN(square_meters)) {
      return { success: false, error: "Square meters must be non-negative" };
    }

    const design_id: string = nanoid(6);
    const imageUrls: string[] = [];
    for (const image of images) {
      const fileName: string = `${nanoid(10)}-${image.name}`;
      const { data, error } = await supabase.storage
        .from("gianconstructimage")
        .upload(fileName, image, { cacheControl: "3600", upsert: false });

      if (error) {
        console.error("Supabase upload error:", {
          bucket: "gianconstructimage",
          fileName,
          error: error.message,
          statusCode: (error as any).statusCode || 500,
        });
        return {
          success: false,
          error: `Failed to upload image: ${error.message}. Check RLS policies for 'gianconstructimage' bucket.`,
        };
      }

      const { data: publicUrlData } = supabase.storage
        .from("gianconstructimage")
        .getPublicUrl(fileName);

      if (!publicUrlData.publicUrl) {
        console.error("Public URL error:", {
          bucket: "gianconstructimage",
          fileName,
        });
        return {
          success: false,
          error: "Failed to get image URL. Ensure bucket is public.",
        };
      }

      imageUrls.push(publicUrlData.publicUrl);
    }

    const designData = {
      design_id,
      name,
      description,
      price,
      number_of_rooms,
      square_meters,
      category,
      images: imageUrls,
    };
    console.log("Design data before save:", designData);

    const design = new DesignModel(designData);
    const savedDesign = await design.save();
    console.log("Design saved:", {
      design_id: savedDesign.design_id,
      category: savedDesign.category,
      _id: savedDesign._id.toString(),
    });

    revalidatePath("/admin/catalog");
    return {
      success: true,
      design: {
        _id: savedDesign._id.toString(),
        design_id: savedDesign.design_id,
        name: savedDesign.name,
        description: savedDesign.description,
        price: savedDesign.price,
        number_of_rooms: savedDesign.number_of_rooms,
        square_meters: savedDesign.square_meters,
        category: savedDesign.category,
        images: savedDesign.images,
        createdAt: savedDesign.createdAt,
        updatedAt: savedDesign.updatedAt,
      },
    };
  } catch (error: unknown) {
    console.error("Add design error:", (error as Error).message, error);
    return {
      success: false,
      error: `Failed to add design: ${(error as Error).message || "Unknown error"}`,
    };
  }
}

export async function deleteDesign(id: string): Promise<DeleteDesignResponse> {
  try {
    await dbConnect();
    const design = await DesignModel.findById(id);
    if (!design) {
      return { success: false, error: "Design not found" };
    }

    const imagePaths: string[] = design.images.map((url: string): string => {
      const parts = url.split("/");
      return parts[parts.length - 1];
    });

    if (imagePaths.length > 0) {
      const { error } = await supabase.storage
        .from("gianconstructimage")
        .remove(imagePaths);
      if (error) {
        console.error("Supabase delete error:", {
          bucket: "gianconstructimage",
          imagePaths,
          error: error.message,
          statusCode: (error as any).statusCode || 500,
        });
        return {
          success: false,
          error: `Failed to delete images from Supabase: ${error.message}. Check RLS DELETE policy.`,
        };
      }
    }

    await DesignModel.findByIdAndDelete(id);
    revalidatePath("/admin/catalog");
    return { success: true };
  } catch (error: unknown) {
    console.error("Delete design error:", error);
    return {
      success: false,
      error: `Failed to delete design: ${(error as Error).message || "Unknown error"}`,
    };
  }
}

export async function getDesigns(): Promise<GetDesignsResponse> {
  try {
    await dbConnect();
    const designs = await DesignModel.find().lean();
    const mappedDesigns: Design[] = designs.map((d: any) => ({
      _id: d._id.toString(),
      design_id: d.design_id,
      name: d.name,
      description: d.description,
      price: d.price,
      number_of_rooms: d.number_of_rooms,
      square_meters: d.square_meters,
      category: d.category || "Unknown",
      images: d.images,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt),
    }));

    console.log(
      "Fetched designs:",
      mappedDesigns.map((d) => ({
        design_id: d.design_id,
        category: d.category,
      }))
    );
    return { success: true, designs: mappedDesigns };
  } catch (error: unknown) {
    console.error("Get designs error:", error);
    return {
      success: false,
      error: `Failed to fetch designs: ${(error as Error).message || "Unknown error"}`,
    };
  }
}
