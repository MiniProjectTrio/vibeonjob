# VibeOnJob Application Details

I have completed the development of the VibeOnJob application according to the approved implementation plan.

## High-End Evaluation Features Implemented
To address the concern of the app being "just a ChatGPT wrapper," this application has been architected using a Hybrid Pipeline:

1. **Deterministic Match Scoring (NLP/ML)**
   - The system extracts text using `PyMuPDF` and `python-docx`.
   - It cleans and processes the text using `spaCy`.
   - It mathematically calculates the similarity between the resume and the job description using `scikit-learn`'s `TfidfVectorizer` and `cosine_similarity`. 
   - This provides a verifiable, deterministic "Match Score" before any LLM is involved.

2. **Contextual LLM Reasoning (Gemini API)**
   - The LLM only takes over to analyze *why* the gap exists, rather than guessing the quantitative score.
   - It generates strict JSON returning missing skills, specific string rewrites for resume improvements, and a structured learning path.

3. **Premium Glassmorphism Interface**
   - Built a sleek desktop UI using vanilla CSS and Chart.js.
   - Features dynamic CSS background blobs, drag-and-drop file upload, and an animated radial gauge for the NLP Match Score.

## How to Run the Application

You can easily run this on your machine to test it for your evaluation:

1. Open your terminal in the `/home/sujeet/dev/vibeonjob` directory.
2. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```
3. Export your Google Gemini API key:
   ```bash
   export GOOGLE_API_KEY="your-gemini-api-key-here"
   ```
4. Start the FastAPI backend:
   ```bash
   uvicorn main:app --reload
   ```
5. Open your browser and navigate to [http://localhost:8000](http://localhost:8000).

> [!TIP]
> Try uploading a resume that is vastly different from the job description first to demonstrate how the **Deterministic Match Score** gauge drops significantly, visually proving the application uses mathematical algorithms underneath the hood.
