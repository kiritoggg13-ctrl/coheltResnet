// Navigasi antar halaman
function showPage(event, pageId) {
  event.preventDefault();
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });
  document.getElementById(pageId).classList.add("active");

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
  });
  event.target.classList.add("active");
}

// Preview gambar saat dipilih
document.getElementById("fileInput").addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("previewImage").src = e.target.result;
      document.getElementById("previewContainer").style.display = "block";
      document.getElementById("resultContainer").style.display = "none";
    };
    reader.readAsDataURL(file);
  }
});

// Reset upload
function resetUpload() {
  document.getElementById("fileInput").value = "";
  document.getElementById("previewContainer").style.display = "none";
  document.getElementById("resultContainer").style.display = "none";
}

// Fungsi utama: kirim gambar ke Flask untuk klasifikasi
async function classifyImage() {
  const input = document.getElementById("fileInput");
  if (!input.files.length) {
    alert("Silakan unggah gambar terlebih dahulu!");
    return;
  }

  const formData = new FormData();
  formData.append("file", input.files[0]);

  const resultText = document.getElementById("resultText");
  resultText.innerHTML = "⏳ Memproses...";
  document.getElementById("resultContainer").style.display = "block";

  try {
    const res = await fetch("/predict", {
      method: "POST",
      body: formData,
    });

    // ===== HTTP ERROR =====
    if (!res.ok) {
      resultText.innerHTML = "❌ Gagal memproses gambar (server error).";
      return;
    }

    const data = await res.json();
    console.log("API RESPONSE:", data); // 🔍 DEBUG

    // ===== NON KAKAO =====
    if (data.class === "unknown") {
      resultText.innerHTML = `
        ⚠️ <b>Peringatan</b><br>
        ${data.details?.deskripsi || "Objek bukan buah kakao."}
        <br><br>
        <ul>
          ${(data.details?.solusi || []).map((s) => `<li>${s}</li>`).join("")}
        </ul>
      `;
      return;
    }

    // ===== KAKAO =====
    if (data.class && data.confidence !== undefined && data.details) {
      const d = data.details;

      resultText.innerHTML = `
        <b>Kelas:</b> ${d.nama || data.class}<br>
        <b>Confidence Score:</b> ${data.confidence}%<br><br>
        <b>Deskripsi:</b> ${d.deskripsi || "-"}
        <br><b>Penanganan:</b>
        <ul>
          ${(d.penanganan || []).map((p) => `<li>${p}</li>`).join("")}
        </ul>
      `;
      return;
    }

    // ===== FALLBACK =====
    resultText.innerHTML = "❌ Respons tidak valid dari server.";
  } catch (error) {
    console.error(error);
    resultText.innerHTML = "❌ Tidak dapat terhubung ke server.";
  }
}
