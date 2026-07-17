import os
from langchain_core.documents import Document
from app.rag.text_splitter import TextSplitterService
from app.rag.vector_store import VectorStoreService

def seed_knowledge_base():
    # Ensure KB dir exists
    kb_dir = "./knowledge_base"
    if not os.path.exists(kb_dir):
        os.makedirs(kb_dir)

    # We will create a few dummy documents for testing
    doc1 = Document(
        page_content="""
Forward Head Posture (FHP) is a common postural issue where the head sits forward of the shoulders. 
This can cause neck pain, tension headaches, and upper back stiffness. 
The best exercises to correct Forward Head Posture are Chin Tucks, Neck Extension Stretches, and Levator Scapulae Stretches.
When performing a Chin Tuck, ensure your chin remains parallel to the floor. Do not tilt it up or down.
If a patient experiences severe, shooting pain or numbness down their arms, they should stop immediately and consult a doctor, as this may indicate nerve compression.
        """,
        metadata={"source": "Clinical Guidelines for FHP.md"}
    )
    
    doc2 = Document(
        page_content="""
Rounded Shoulders occur when the shoulders rest forward of the body's center line.
This is often caused by tight chest muscles (pectoralis major and minor) and weak upper back muscles (rhomboids and mid-trapezius).
Effective treatments include Wall Angels, Doorway Pectoral Stretches, and Scapular Retractions.
During Wall Angels, patients should ensure their lower back does not arch excessively away from the wall.
        """,
        metadata={"source": "Shoulder Rehabilitation Handbook.md"}
    )
    
    doc3 = Document(
        page_content="""
General Ergonomics for Desk Workers:
- Keep the monitor at eye level.
- Ensure feet are flat on the floor or on a footrest.
- Take a 5-minute break every hour to stand and perform light stretches like Cat-Cow or Bird Dog.
- Avoid slouching by engaging the core lightly while sitting.
        """,
        metadata={"source": "Ergonomics Best Practices.md"}
    )
    
    print("Splitting documents...")
    splitter = TextSplitterService(chunk_size=500, chunk_overlap=50)
    docs = splitter.split_documents([doc1, doc2, doc3])
    
    print(f"Generated {len(docs)} chunks. Adding to Vector Store...")
    vector_store = VectorStoreService()
    try:
        vector_store.add_documents(docs)
        print("Knowledge base seeded successfully!")
    except Exception as e:
        print(f"Error seeding KB: {e}")

if __name__ == "__main__":
    seed_knowledge_base()
