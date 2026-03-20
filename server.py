from flask import Flask, jsonify, send_file, abort
from flask_cors import CORS
import json, os

app = Flask(__name__)
CORS(app)  # needed so React app on :3000 can call this on :5000

PAPERS = {
    "mack_et_al_chi2021":        {"pdf": "pdfs/mack_et_al_chi2021.pdf",        "doc": "processed/mack_et_al_chi2021.json"}
}

@app.route("/paper/<paper_id>/pdf")
def serve_pdf(paper_id):
    if paper_id not in PAPERS:
        abort(404)
    return send_file(PAPERS[paper_id]["pdf"], mimetype="application/pdf")

@app.route("/paper/<paper_id>/doc")
def serve_doc(paper_id):
    if paper_id not in PAPERS:
        abort(404)
    with open(PAPERS[paper_id]["doc"]) as f:
        return jsonify(json.load(f))

@app.route("/papers")
def list_papers():
    return jsonify(list(PAPERS.keys()))

if __name__ == "__main__":
    app.run(port=5001, debug=True)