// frontend/testFetch.js
import fetch from "node-fetch";

async function test() {
  try {
    const res = await fetch("http://localhost:5000/");
    const text = await res.text();
    console.log(text);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

test();
