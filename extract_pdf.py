import fitz  # PyMuPDF
import os

pdf_path = r"d:\Drive\Proyectos\Alabando\original\app\src\main\assets\Partituras.pdf"
output_dir = r"d:\Drive\Proyectos\Alabando\web\public\partituras"

os.makedirs(output_dir, exist_ok=True)

try:
    doc = fitz.open(pdf_path)
    print(f"Extracting {doc.page_count} pages...")
    for i in range(doc.page_count):
        page = doc.load_page(i)
        zoom = 3.0  # High quality: 3x zoom (~216 DPI equivalent)
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        
        output_path = os.path.join(output_dir, f"page_{i + 1}.png")
        pix.save(output_path)
        if (i + 1) % 50 == 0:
            print(f"Processed {i + 1} pages...")
            
    print("Done extracting pages.")
except Exception as e:
    print("Error:", e)
