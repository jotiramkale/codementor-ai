import os
import streamlit as st
from dotenv import load_dotenv
from groq import Groq

# Load API Key
load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

st.set_page_config(
    page_title="AI DSA Code Reviewer",
    page_icon="🤖",
    layout="wide"
)

st.title("🤖 AI DSA Code Reviewer")
st.write("Paste a DSA problem and solution. AI will review the code.")

problem_statement = st.text_area(
    "Problem Statement",
    height=200,
    placeholder="Enter DSA problem statement here..."
)

student_code = st.text_area(
    "Student Code",
    height=300,
    placeholder="Paste Python code here..."
)

if st.button("Review Code"):

    if not problem_statement or not student_code:
        st.warning("Please enter both problem statement and code.")
    else:

        prompt = f"""
You are an expert DSA code reviewer.

Problem Statement:
{problem_statement}

Student Code:
{student_code}

Analyze and provide:

1.Correct or not
2.any error or not 
3.any improvements

Format the answer clearly.
"""

        with st.spinner("Analyzing Code..."):

            response = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            review = response.choices[0].message.content

        st.success("Review Complete!")

        st.subheader("AI Review")
        st.markdown(review)