import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    const results: Array<{
      name: string;
      size: number;
      path: string;
      type: string;
    }> = [];
    const errors: string[] = [];

    for (const entry of files) {
      if (!(entry instanceof File)) {
        errors.push('Entrada invalida no formulario');
        continue;
      }

      const file = entry;

      // Validate type
      if (!ALLOWED_TYPES.has(file.type)) {
        errors.push(`Tipo nao permitido: ${file.name} (${file.type})`);
        continue;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`Arquivo muito grande: ${file.name}`);
        continue;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const ext = path.extname(file.name);
      const safeName = file.name
        .replace(ext, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 50);
      const filename = `${timestamp}-${random}-${safeName}${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(UPLOAD_DIR, filename);
      await writeFile(filePath, buffer);

      results.push({
        name: file.name,
        size: file.size,
        path: `/uploads/${filename}`,
        type: file.type,
      });
    }

    return NextResponse.json({
      uploaded: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: 'Erro ao processar upload' },
      { status: 500 }
    );
  }
}
