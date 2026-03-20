# from papermage.recipes import CoreRecipe

# recipe = CoreRecipe()
# doc = recipe.run("paper.pdf")

# for page in doc.pages:
#     for block in page.blocks:
#         print(block.text)

# import json

# doc_json = doc.to_json()
# with open("mack_et_al.json", "w") as f:
#     json.dump(doc_json, f)

from papermage.recipes import CoreRecipe
import json, os

recipe = CoreRecipe()

papers = {
    "mack_et_al_chi2021":        "pdfs/mack_et_al_chi2021.pdf"
}

os.makedirs("processed", exist_ok=True)

for paper_id, pdf_path in papers.items():
    print(f"Processing {paper_id}...")
    doc = recipe.run(pdf_path)
    with open(f"processed/{paper_id}.json", "w") as f:
        json.dump(doc.to_json(), f)
    print(f"  Done → processed/{paper_id}.json")