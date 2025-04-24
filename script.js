const CLIENT_ID = "36321363025-d2065951vh677c84bn1ofh4dko5fese2.apps.googleusercontent.com";
const FOLDER_ID = "12W81Xq8P2o7HzHQ_sIYQKIAm7aqa3BX6";
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

let tokenClient;
let accessToken;

document.getElementById("signin-button").addEventListener("click", () => {
  tokenClient.requestAccessToken();
});

window.onload = () => {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      loadDriveFiles();
    },
  });
};

async function loadDriveFiles() {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "<p class='text-center col-span-full'>Cargando archivos...</p>";

  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,thumbnailLink,webViewLink)&key=AIzaSyC...`, // Puedes dejar la key vacía si solo usas OAuth
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await res.json();
    gallery.innerHTML = "";

    if (data.files.length === 0) {
      gallery.innerHTML = "<p class='col-span-full text-center'>No hay archivos para mostrar.</p>";
      return;
    }

    data.files.forEach((file) => {
      const card = document.createElement("div");
      card.className = "bg-white shadow rounded overflow-hidden";

      const link = document.createElement("a");
      link.href = file.webViewLink;
      link.target = "_blank";

      const img = document.createElement("img");
      img.src = file.thumbnailLink || "https://via.placeholder.com/150";
      img.alt = file.name;
      img.className = "w-full h-48 object-cover";

      const caption = document.createElement("div");
      caption.className = "p-2 text-center text-sm font-medium";
      caption.innerText = file.name;

      link.appendChild(img);
      card.appendChild(link);
      card.appendChild(caption);
      gallery.appendChild(card);
    });
  } catch (error) {
    gallery.innerHTML = `<p class='col-span-full text-center text-red-600'>Error al cargar archivos: ${error.message}</p>`;
  }
}
