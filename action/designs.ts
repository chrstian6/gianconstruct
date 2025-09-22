"use server";

// Import revalidatePath with proper typing
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
  RevalidatePath,
} from "@/types/design";

// Helper type aligned with Design interface
type LeanDesign = {
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
  maxLoanTerm?: number | null;
  loanTermType?: "months" | "years" | null;
  interestRate?: number | null;
  interestRateType?: "monthly" | "yearly" | null;
  createdAt?: string;
  updatedAt?: string;
};

const ADMIN_CATALOG_PATH: RevalidatePath = "/admin/catalog";

export async function addDesign(
  formData: FormData
): Promise<AddDesignResponse> {
  try {
    await dbConnect();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const number_of_rooms = parseInt(formData.get("number_of_rooms") as string);
    const square_meters = parseInt(formData.get("square_meters") as string);
    const category = formData.get("category") as string;
    const images = formData.getAll("images") as File[];
    const createdBy = (formData.get("createdBy") as string) || "Admin";
    const isLoanOffer = formData.get("isLoanOffer") === "true";
    const maxLoanTermInput = formData.get("maxLoanTerm") as string | null;
    const loanTermType =
      (formData.get("loanTermType") as "months" | "years" | null) || "years";
    const interestRate = formData.get("interestRate")
      ? parseFloat(formData.get("interestRate") as string)
      : null;
    const interestRateType =
      (formData.get("interestRateType") as "monthly" | "yearly" | null) ||
      "yearly";

    // FIXED: Convert maxLoanTerm based on loanTermType - ALWAYS store in months
    let maxLoanTerm: number | null = null;
    if (maxLoanTermInput && maxLoanTermInput !== "null") {
      const term = parseInt(maxLoanTermInput);
      // Convert years to months for consistent storage
      maxLoanTerm = loanTermType === "years" ? term * 12 : term;
    }

    if (isLoanOffer) {
      if (maxLoanTerm === null || maxLoanTerm < 1 || maxLoanTerm > 360) {
        throw new Error(
          "maxLoanTerm must be between 1 and 360 months when loan is offered"
        );
      }
      if (interestRate === null || interestRate < 0) {
        throw new Error(
          "interestRate must be a non-negative number when loan is offered"
        );
      }
    }

    const imageUrls: string[] = [];
    for (const image of images) {
      const fileName = `${nanoid(10)}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("gianconstructimage")
        .upload(fileName, image, { cacheControl: "3600", upsert: false });

      if (uploadError)
        throw new Error(`Image upload failed: ${uploadError.message}`);

      const { data: publicUrlData } = supabase.storage
        .from("gianconstructimage")
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) throw new Error("Couldn't get image URL");
      imageUrls.push(publicUrlData.publicUrl);
    }

    const designData = {
      name,
      description,
      price,
      number_of_rooms,
      square_meters,
      category,
      images: imageUrls,
      createdBy,
      isLoanOffer,
      // Only include loan-related fields if isLoanOffer is true
      ...(isLoanOffer && {
        maxLoanTerm,
        loanTermType,
        interestRate,
        interestRateType,
      }),
      design_id: nanoid(10),
    };

    // Create the design without _id by using the raw data
    const savedDesign = await DesignModel.create(designData);

    // Convert to plain object and remove _id
    const designObject = savedDesign.toObject();
    const { _id, __v, ...cleanDesign } = designObject;

    const resultDesign: Design = {
      design_id: cleanDesign.design_id,
      name: cleanDesign.name,
      description: cleanDesign.description,
      price: cleanDesign.price,
      number_of_rooms: cleanDesign.number_of_rooms,
      square_meters: cleanDesign.square_meters,
      category: cleanDesign.category,
      images: cleanDesign.images,
      createdBy: cleanDesign.createdBy,
      isLoanOffer: cleanDesign.isLoanOffer,
      maxLoanTerm: cleanDesign.maxLoanTerm ?? null,
      loanTermType: cleanDesign.loanTermType ?? null,
      interestRate: cleanDesign.interestRate ?? null,
      interestRateType: cleanDesign.interestRateType ?? null,
      createdAt: cleanDesign.createdAt?.toISOString(),
      updatedAt: cleanDesign.updatedAt?.toISOString(),
    };

    revalidatePath("/admin/catalog" as const);
    return {
      success: true,
      design: resultDesign,
    };
  } catch (error) {
    console.error("Add design error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add design",
    };
  }
}

export async function updateDesign(
  id: string,
  formData: FormData
): Promise<UpdateDesignResponse> {
  try {
    await dbConnect();

    const existingDesign = await DesignModel.findOne({ design_id: id });
    if (!existingDesign) {
      return { success: false, error: "Design not found" };
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const number_of_rooms = parseInt(formData.get("number_of_rooms") as string);
    const square_meters = parseInt(formData.get("square_meters") as string);
    const category = formData.get("category") as string;
    const existingImages = JSON.parse(
      formData.get("existingImages") as string
    ) as string[];
    const newImages = formData.getAll("images") as File[];
    const createdBy = (formData.get("createdBy") as string) || "Admin";
    const isLoanOffer = formData.get("isLoanOffer") === "true";
    const maxLoanTermInput = formData.get("maxLoanTerm") as string | null;
    const loanTermType =
      (formData.get("loanTermType") as "months" | "years" | null) || "years";
    const interestRate = formData.get("interestRate")
      ? parseFloat(formData.get("interestRate") as string)
      : null;
    const interestRateType =
      (formData.get("interestRateType") as "monthly" | "yearly" | null) ||
      "yearly";

    // FIXED: Convert maxLoanTerm based on loanTermType - ALWAYS store in months
    let maxLoanTerm: number | null = null;
    if (maxLoanTermInput && maxLoanTermInput !== "null") {
      const term = parseInt(maxLoanTermInput);
      // Convert years to months for consistent storage
      maxLoanTerm = loanTermType === "years" ? term * 12 : term;
    }

    if (isLoanOffer) {
      if (maxLoanTerm === null || maxLoanTerm < 1 || maxLoanTerm > 360) {
        throw new Error(
          "maxLoanTerm must be between 1 and 360 months when loan is offered"
        );
      }
      if (interestRate === null || interestRate < 0) {
        throw new Error(
          "interestRate must be a non-negative number when loan is offered"
        );
      }
    }

    const newImageUrls: string[] = [];
    for (const image of newImages) {
      const fileName = `${nanoid(10)}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("gianconstructimage")
        .upload(fileName, image, { cacheControl: "3600", upsert: false });

      if (uploadError)
        throw new Error(`Image upload failed: ${uploadError.message}`);

      const { data: publicUrlData } = supabase.storage
        .from("gianconstructimage")
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) throw new Error("Couldn't get image URL");
      newImageUrls.push(publicUrlData.publicUrl);
    }

    const updateData = {
      name,
      description,
      price,
      number_of_rooms,
      square_meters,
      category,
      images: [...existingImages, ...newImageUrls],
      createdBy,
      isLoanOffer,
      // Only include loan-related fields if isLoanOffer is true, otherwise set to undefined
      ...(isLoanOffer
        ? {
            maxLoanTerm,
            loanTermType,
            interestRate,
            interestRateType,
          }
        : {
            maxLoanTerm: undefined,
            loanTermType: undefined,
            interestRate: undefined,
            interestRateType: undefined,
          }),
    };

    const updatedDesign = await DesignModel.findOneAndUpdate(
      { design_id: id },
      updateData,
      { new: true }
    );

    if (!updatedDesign) {
      throw new Error("Failed to update design");
    }

    // Convert to plain object and remove _id
    const designObject = updatedDesign.toObject();
    const { _id, __v, ...cleanDesign } = designObject;

    const resultDesign: Design = {
      design_id: cleanDesign.design_id,
      name: cleanDesign.name,
      description: cleanDesign.description,
      price: cleanDesign.price,
      number_of_rooms: cleanDesign.number_of_rooms,
      square_meters: cleanDesign.square_meters,
      category: cleanDesign.category,
      images: cleanDesign.images,
      createdBy: cleanDesign.createdBy,
      isLoanOffer: cleanDesign.isLoanOffer,
      maxLoanTerm: cleanDesign.maxLoanTerm ?? null,
      loanTermType: cleanDesign.loanTermType ?? null,
      interestRate: cleanDesign.interestRate ?? null,
      interestRateType: cleanDesign.interestRateType ?? null,
      createdAt: cleanDesign.createdAt?.toISOString(),
      updatedAt: cleanDesign.updatedAt?.toISOString(),
    };

    revalidatePath("/admin/catalog" as const);
    return {
      success: true,
      design: resultDesign,
    };
  } catch (error) {
    console.error("Update design error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update design",
    };
  }
}

export async function deleteDesign(id: string): Promise<DeleteDesignResponse> {
  try {
    await dbConnect();

    const design = await DesignModel.findOne({ design_id: id });
    if (!design) {
      return {
        success: false,
        error: "Design not found",
      };
    }

    const imagePaths = design.images
      .map((url: string) => url.split("/").pop())
      .filter((path: string | undefined): path is string => path !== undefined);

    if (imagePaths.length > 0) {
      const { error } = await supabase.storage
        .from("gianconstructimage")
        .remove(imagePaths);

      if (error) {
        return {
          success: false,
          error: `Image deletion failed: ${error.message}`,
        };
      }
    }

    const { deletedCount } = await DesignModel.deleteOne({ design_id: id });

    if (deletedCount === 0) {
      return {
        success: false,
        error: "No design was deleted",
      };
    }

    revalidatePath(ADMIN_CATALOG_PATH);
    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete design error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete design",
    };
  }
}

export async function getDesigns(): Promise<GetDesignsResponse> {
  try {
    await dbConnect();
    const designs = await DesignModel.find().lean().exec();

    const resultDesigns: Design[] = designs.map((design: any) => ({
      design_id: design.design_id,
      name: design.name,
      description: design.description,
      price: design.price,
      number_of_rooms: design.number_of_rooms,
      square_meters: design.square_meters,
      category: design.category,
      images: design.images,
      createdBy: design.createdBy,
      isLoanOffer: design.isLoanOffer,
      maxLoanTerm: design.maxLoanTerm ?? null,
      loanTermType: design.loanTermType ?? null,
      interestRate: design.interestRate ?? null,
      interestRateType: design.interestRateType ?? null,
      createdAt: design.createdAt,
      updatedAt: design.updatedAt,
    }));

    return {
      success: true,
      designs: resultDesigns,
    };
  } catch (error) {
    console.error("Get designs error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch designs",
    };
  }
}
