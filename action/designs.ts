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
  UpdateDesignResponse,
  Design,
} from "@/types/design";

export async function addDesign(
  formData: FormData
): Promise<AddDesignResponse> {
  try {
    await dbConnect();
    const name = formData.get("name");
    const description = formData.get("description");
    const price = formData.get("price");
    const number_of_rooms = formData.get("number_of_rooms");
    const square_meters = formData.get("square_meters");
    const category = formData.get("category");
    const images = formData.getAll("images");
    const createdBy = formData.get("createdBy");
    const isLoanOffer = formData.get("isLoanOffer");
    const maxLoanYears = formData.get("maxLoanYears");
    const interestRate = formData.get("interestRate");

    if (
      typeof name !== "string" ||
      typeof description !== "string" ||
      typeof price !== "string" ||
      typeof number_of_rooms !== "string" ||
      typeof square_meters !== "string" ||
      typeof category !== "string" ||
      typeof createdBy !== "string" ||
      typeof isLoanOffer !== "string" ||
      (maxLoanYears && typeof maxLoanYears !== "string") ||
      (interestRate && typeof interestRate !== "string") ||
      !images.every((image) => image instanceof File)
    ) {
      console.error("Invalid field types:", {
        name: typeof name,
        description: typeof description,
        price: typeof price,
        number_of_rooms: typeof number_of_rooms,
        square_meters: typeof square_meters,
        category: typeof category,
        createdBy: typeof createdBy,
        isLoanOffer: typeof isLoanOffer,
        maxLoanYears: typeof maxLoanYears,
        interestRate: typeof interestRate,
        images: images.map((img) =>
          img instanceof File ? "File" : typeof img
        ),
      });
      return { success: false, error: "Invalid field types" };
    }

    console.log("FormData received:", {
      name,
      description,
      price,
      number_of_rooms,
      square_meters,
      category,
      createdBy,
      isLoanOffer,
      maxLoanYears,
      interestRate,
      images: images.length,
    });

    const parsedPrice = parseFloat(price);
    const parsedNumberOfRooms = parseInt(number_of_rooms, 10);
    const parsedSquareMeters = parseInt(square_meters, 10);
    const parsedIsLoanOffer = isLoanOffer === "true";
    const parsedMaxLoanYears = maxLoanYears ? parseInt(maxLoanYears, 10) : null;
    const parsedInterestRate = interestRate ? parseFloat(interestRate) : null;

    if (
      !name ||
      !description ||
      isNaN(parsedPrice) ||
      isNaN(parsedNumberOfRooms) ||
      isNaN(parsedSquareMeters) ||
      !category ||
      !createdBy ||
      images.length === 0 ||
      (parsedIsLoanOffer && (!parsedMaxLoanYears || !parsedInterestRate))
    ) {
      console.error("Missing or invalid fields:", {
        name,
        description,
        price: parsedPrice,
        number_of_rooms: parsedNumberOfRooms,
        square_meters: parsedSquareMeters,
        category,
        createdBy,
        isLoanOffer: parsedIsLoanOffer,
        maxLoanYears: parsedMaxLoanYears,
        interestRate: parsedInterestRate,
        images,
      });
      return {
        success: false,
        error: "All fields are required, including loan details if offered",
      };
    }

    if (parsedPrice < 0) {
      return { success: false, error: "Invalid price" };
    }

    if (parsedNumberOfRooms < 1) {
      return { success: false, error: "Number of rooms must be at least 1" };
    }

    if (parsedSquareMeters < 0) {
      return { success: false, error: "Square meters must be non-negative" };
    }

    if (parsedIsLoanOffer) {
      if (
        parsedMaxLoanYears &&
        (parsedMaxLoanYears < 1 || parsedMaxLoanYears > 30)
      ) {
        return {
          success: false,
          error: "Loan term must be between 1 and 30 years",
        };
      }
      if (parsedInterestRate && parsedInterestRate < 0) {
        return { success: false, error: "Interest rate must be non-negative" };
      }
    }

    const design_id: string = nanoid(10);
    const imageUrls: string[] = [];
    for (const image of images) {
      const fileName: string = `${nanoid(10)}-${image.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from("gianconstructimage")
        .upload(fileName, image, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        console.error("Supabase upload error:", {
          bucket: "gianconstructimage",
          fileName,
          error: JSON.stringify(uploadError, null, 2),
        });
        return {
          success: false,
          error: `Failed to upload image: ${uploadError.message}`,
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
          error: "Failed to get image URL",
        };
      }

      imageUrls.push(publicUrlData.publicUrl);
    }

    const designData = {
      design_id,
      name,
      description,
      price: parsedPrice,
      number_of_rooms: parsedNumberOfRooms,
      square_meters: parsedSquareMeters,
      category,
      images: imageUrls,
      createdBy,
      isLoanOffer: parsedIsLoanOffer,
      maxLoanYears: parsedIsLoanOffer ? parsedMaxLoanYears : null,
      interestRate: parsedIsLoanOffer ? parsedInterestRate : null,
    };
    console.log("Design data before save:", designData);

    const design = new DesignModel(designData);
    const validationError = design.validateSync();
    if (validationError) {
      console.error("Validation error:", validationError.errors);
      return {
        success: false,
        error: `Validation failed: ${validationError.message}`,
      };
    }

    console.log("Saving design to database:", designData);
    const savedDesign = await design.save();
    console.log("Raw saved design:", savedDesign.toObject());

    const savedDesignDoc = (await DesignModel.findById(
      savedDesign._id
    ).lean()) as unknown as {
      _id: any;
      design_id: string;
      name: string;
      description: string;
      price: number;
      number_of_rooms: number;
      square_meters: number;
      category: string;
      images: string[];
      createdBy: string;
      isLoanOffer: boolean;
      maxLoanYears: number | null;
      interestRate: number | null;
      createdAt: Date;
      updatedAt: Date;
    };

    if (!savedDesignDoc) {
      console.error(
        "Failed to retrieve saved design with ID:",
        savedDesign._id
      );
      return { success: false, error: "Failed to retrieve saved design" };
    }

    const plainDesign: Design = {
      _id: savedDesignDoc._id.toString(),
      design_id: savedDesignDoc.design_id,
      name: savedDesignDoc.name,
      description: savedDesignDoc.description,
      price: savedDesignDoc.price,
      number_of_rooms: savedDesignDoc.number_of_rooms,
      square_meters: savedDesignDoc.square_meters,
      category: savedDesignDoc.category,
      images: savedDesignDoc.images,
      createdBy: savedDesignDoc.createdBy,
      isLoanOffer: savedDesignDoc.isLoanOffer,
      maxLoanYears: savedDesignDoc.maxLoanYears,
      interestRate: savedDesignDoc.interestRate,
      createdAt: savedDesignDoc.createdAt.toISOString(),
      updatedAt: savedDesignDoc.updatedAt.toISOString(),
    };

    console.log("Design saved:", plainDesign);

    revalidatePath("/admin/catalog");
    return {
      success: true,
      design: plainDesign,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Add design error:", errorMessage);
    return {
      success: false,
      error: `Failed to add design: ${errorMessage}`,
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

    const imagePaths: string[] = design.images
      .map((url: string) => url.split("/").pop() || "")
      .filter((path: string) => !!path);

    if (imagePaths.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from("gianconstructimage")
        .remove(imagePaths);

      if (deleteError) {
        console.error("Supabase delete error:", {
          bucket: "gianconstructimage",
          imagePaths,
          error: JSON.stringify(deleteError, null, 2),
        });
        return {
          success: false,
          error: `Failed to delete images: ${deleteError.message}`,
        };
      }
    }

    await DesignModel.findByIdAndDelete(id);
    revalidatePath("/admin/catalog");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Delete design error:", errorMessage);
    return {
      success: false,
      error: `Failed to delete design: ${errorMessage}`,
    };
  }
}

export async function updateDesign(
  id: string,
  formData: FormData
): Promise<UpdateDesignResponse> {
  try {
    await dbConnect();
    const design = await DesignModel.findById(id);
    if (!design) {
      return { success: false, error: "Design not found" };
    }

    const name = formData.get("name");
    const description = formData.get("description");
    const price = formData.get("price");
    const number_of_rooms = formData.get("number_of_rooms");
    const square_meters = formData.get("square_meters");
    const category = formData.get("category");
    const images = formData.getAll("images");
    const existingImages = formData.get("existingImages");
    const createdBy = formData.get("createdBy");
    const isLoanOffer = formData.get("isLoanOffer");
    const maxLoanYears = formData.get("maxLoanYears");
    const interestRate = formData.get("interestRate");

    if (
      typeof name !== "string" ||
      typeof description !== "string" ||
      typeof price !== "string" ||
      typeof number_of_rooms !== "string" ||
      typeof square_meters !== "string" ||
      typeof category !== "string" ||
      typeof createdBy !== "string" ||
      typeof existingImages !== "string" ||
      typeof isLoanOffer !== "string" ||
      (maxLoanYears && typeof maxLoanYears !== "string") ||
      (interestRate && typeof interestRate !== "string") ||
      !images.every((image) => image instanceof File || image === "")
    ) {
      console.error("Invalid field types:", {
        name: typeof name,
        description: typeof description,
        price: typeof price,
        number_of_rooms: typeof number_of_rooms,
        square_meters: typeof square_meters,
        category: typeof category,
        createdBy: typeof createdBy,
        existingImages: typeof existingImages,
        isLoanOffer: typeof isLoanOffer,
        maxLoanYears: typeof maxLoanYears,
        interestRate: typeof interestRate,
        images: images.map((img) =>
          img instanceof File ? "File" : typeof img
        ),
      });
      return { success: false, error: "Invalid field types" };
    }

    const parsedPrice = parseFloat(price);
    const parsedNumberOfRooms = parseInt(number_of_rooms, 10);
    const parsedSquareMeters = parseInt(square_meters, 10);
    const parsedIsLoanOffer = isLoanOffer === "true";
    const parsedMaxLoanYears = maxLoanYears ? parseInt(maxLoanYears, 10) : null;
    const parsedInterestRate = interestRate ? parseFloat(interestRate) : null;
    const parsedExistingImages: string[] = JSON.parse(existingImages || "[]");

    console.log("Update FormData received:", {
      id,
      name,
      description,
      price: parsedPrice,
      number_of_rooms: parsedNumberOfRooms,
      square_meters: parsedSquareMeters,
      category,
      createdBy,
      isLoanOffer: parsedIsLoanOffer,
      maxLoanYears: parsedMaxLoanYears,
      interestRate: parsedInterestRate,
      newImages: images.length,
      existingImages: parsedExistingImages,
    });

    if (
      !name ||
      !description ||
      isNaN(parsedPrice) ||
      isNaN(parsedNumberOfRooms) ||
      isNaN(parsedSquareMeters) ||
      !category ||
      !createdBy ||
      (parsedIsLoanOffer && (!parsedMaxLoanYears || !parsedInterestRate))
    ) {
      console.error("Missing fields:", {
        name,
        description,
        price: parsedPrice,
        number_of_rooms: parsedNumberOfRooms,
        square_meters: parsedSquareMeters,
        category,
        createdBy,
        isLoanOffer: parsedIsLoanOffer,
        maxLoanYears: parsedMaxLoanYears,
        interestRate: parsedInterestRate,
      });
      return { success: false, error: "All fields are required" };
    }

    if (parsedPrice < 0) {
      return { success: false, error: "Invalid price" };
    }

    if (parsedNumberOfRooms < 1) {
      return { success: false, error: "Number of rooms must be at least 1" };
    }

    if (parsedSquareMeters < 0) {
      return { success: false, error: "Square meters must be non-negative" };
    }

    if (parsedIsLoanOffer) {
      if (
        parsedMaxLoanYears &&
        (parsedMaxLoanYears < 1 || parsedMaxLoanYears > 30)
      ) {
        return {
          success: false,
          error: "Loan term must be between 1 and 30 years",
        };
      }
      if (parsedInterestRate && parsedInterestRate < 0) {
        return { success: false, error: "Interest rate must be non-negative" };
      }
    }

    const imagesToDelete: string[] = design.images
      .map((url: string) => url.split("/").pop() || "")
      .filter((path: string) => !!path);

    if (imagesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from("gianconstructimage")
        .remove(imagesToDelete);

      if (deleteError) {
        console.error("Supabase delete error:", {
          bucket: "gianconstructimage",
          imagesToDelete,
          error: JSON.stringify(deleteError, null, 2),
        });
        return {
          success: false,
          error: `Failed to delete images: ${deleteError.message}`,
        };
      }
    }

    const newImageUrls: string[] = [];
    for (const image of images) {
      if (!(image instanceof File)) continue;
      const fileName: string = `${nanoid(10)}-${image.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from("gianconstructimage")
        .upload(fileName, image, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        console.error("Supabase upload error:", {
          bucket: "gianconstructimage",
          fileName,
          error: JSON.stringify(uploadError, null, 2),
        });
        return {
          success: false,
          error: `Failed to upload image: ${uploadError.message}`,
        };
      }

      const { data: publicUrlData } = supabase.storage
        .from("gianconstructimage")
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) {
        console.error("Public URL error:", {
          bucket: "gianconstructimage",
          fileName,
        });
        return {
          success: false,
          error: "Failed to get image URL",
        };
      }

      newImageUrls.push(publicUrlData.publicUrl);
    }

    const updatedImages: string[] = [...parsedExistingImages, ...newImageUrls];

    const updatedDesignData = {
      name,
      description,
      price: parsedPrice,
      number_of_rooms: parsedNumberOfRooms,
      square_meters: parsedSquareMeters,
      category,
      images: updatedImages,
      createdBy,
      isLoanOffer: parsedIsLoanOffer,
      maxLoanYears: parsedIsLoanOffer ? parsedMaxLoanYears : null,
      interestRate: parsedIsLoanOffer ? parsedInterestRate : null,
    };

    console.log("Updating design with ID:", { id, updatedDesignData });

    const savedDesign = await DesignModel.findByIdAndUpdate(
      id,
      updatedDesignData,
      { new: true, runValidators: true }
    );
    if (!savedDesign) {
      console.error("Failed to update design with ID:", id);
      return { success: false, error: "Failed to update design" };
    }

    console.log("Raw updated design:", savedDesign.toObject());

    const savedDesignDoc = (await DesignModel.findById(
      savedDesign._id
    ).lean()) as any;

    if (!savedDesignDoc) {
      console.error(
        "Failed to retrieve updated design with ID:",
        savedDesign._id
      );
      return { success: false, error: "Failed to retrieve updated design" };
    }

    const plainDesign: Design = {
      _id: savedDesignDoc._id.toString(),
      design_id: savedDesignDoc.design_id,
      name: savedDesignDoc.name,
      description: savedDesignDoc.description,
      price: savedDesignDoc.price,
      number_of_rooms: savedDesignDoc.number_of_rooms,
      square_meters: savedDesignDoc.square_meters,
      category: savedDesignDoc.category,
      images: savedDesignDoc.images,
      createdBy: savedDesignDoc.createdBy,
      isLoanOffer: savedDesignDoc.isLoanOffer,
      maxLoanYears: savedDesignDoc.maxLoanYears,
      interestRate: savedDesignDoc.interestRate,
      createdAt: savedDesignDoc.createdAt.toISOString(),
      updatedAt: savedDesignDoc.updatedAt.toISOString(),
    };

    console.log("Design updated:", plainDesign);

    revalidatePath("/admin/catalog");
    return {
      success: true,
      design: plainDesign,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Update design error:", errorMessage);
    return {
      success: false,
      error: `Failed to update design: ${errorMessage}`,
    };
  }
}

export async function getDesigns(): Promise<GetDesignsResponse> {
  try {
    await dbConnect();
    const designs = await DesignModel.find().lean().exec();
    const mappedDesigns: Design[] = designs.map((d: any) => ({
      _id: d._id.toString(),
      design_id: d.design_id,
      name: d.name,
      description: d.description,
      price: d.price,
      number_of_rooms: d.number_of_rooms,
      square_meters: d.square_meters,
      category: d.category || "Unknown",
      images: d.images || [],
      createdBy: d.createdBy || "Admin",
      isLoanOffer: d.isLoanOffer ?? false,
      maxLoanYears: d.maxLoanYears ?? null,
      interestRate: d.interestRate ?? null,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));

    console.log(
      "Fetched designs:",
      mappedDesigns.map((d) => ({
        _id: d._id,
        design_id: d.design_id,
        name: d.name,
        description: d.description,
        price: d.price,
        number_of_rooms: d.number_of_rooms,
        square_meters: d.square_meters,
        category: d.category,
        images: d.images,
        createdBy: d.createdBy,
        isLoanOffer: d.isLoanOffer,
        maxLoanYears: d.maxLoanYears,
        interestRate: d.interestRate,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }))
    );
    return { success: true, designs: mappedDesigns };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Get designs error:", errorMessage);
    return {
      success: false,
      error: `Failed to fetch designs: ${errorMessage}`,
    };
  }
}
