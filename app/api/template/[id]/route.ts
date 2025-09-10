import { readTemplateStructureFromJson, saveTemplateStructureToJson } from "@/features/playground/libs/path-to-json";
import { db } from "@/lib/db";
import path from "path";
import fs from "fs/promises";
import { NextRequest } from "next/server";
import { templatePaths } from "@/lib/template";

function validateJsonStructure(data: unknown): boolean {
    try {
        JSON.parse(JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{id: string}> }) {
    const { id } = await params;
    if(!id) {
        return Response.json({
            error: "Missing Playground ID",
        }, {
            status: 404,
        });
    }

    const playground = await db.playground.findUnique({ where: { id } });

    if(!playground) {
        return Response.json({
            error: "Playground not found",
        }, {
            status: 404
        });
    }

    const templateKey = playground.template as keyof typeof templatePaths;
    const templatePath = templatePaths[templateKey];

    if(!templatePath) {
        return Response.json({
            error: "Template not found",
        }, {
            status: 404
        });
    }

    try {
        const inputPath = path.join(process.cwd(), templatePath);
        const outputFile = path.join(process.cwd(), `output/${templateKey}.json`);

        await saveTemplateStructureToJson(inputPath, outputFile);
        const res = await readTemplateStructureFromJson(outputFile);

        if(!validateJsonStructure(res.items)) {
            return Response.json({
                error: "Invalid JSON structure",
            }, {
                status: 500
            });
        }

        await fs.unlink(outputFile);

        return Response.json({
            success: true,
            templateJson: res
        }, {
            status: 200
        })
    } catch (error) {
        console.error("Error generating template JSON: ", error);
        return Response.json({
            error: "Failed to generate template",
        }, {
            status: 500,
        })
    }
}