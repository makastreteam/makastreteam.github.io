const CLIENT_ID = "36321363025-d2065951vh677c84bn1ofh4dko5fese2.apps.googleusercontent.com";
const FOLDER_ID = "12W81Xq8P2o7HzHQ_sIYQKIAm7aqa3BX6"; // ID de la carpeta principal
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

let tokenClient;
let accessToken;
let folders = [];

document.getElementById("signin-button").addEventListener("click", () => {
  tokenClient.requestAccessToken();
});

document.getElementById("back-button").addEventListener("click", () => {
  showCalendar();
});

window.onload = () => {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      loadFolders();
    },
  });
};

async function loadFolders() {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents+and+trashed=false+and+mimeType='application/vnd.google-apps.folder'&fields=files(id,name)&key=AIzaSyC...`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await res.json();
    folders = data.files;

    // Ordenamos las carpetas por fecha
    folders.sort((a, b) => {
      const dateA = parseDate(a.name);
      const dateB = parseDate(b.name);
      return dateA - dateB;
    });

    renderCalendar(folders);
  } catch (error) {
    console.error("Error al cargar las carpetas: ", error);
  }
}

function parseDate(folderName) {
  const [day, month, year] = folderName.split(" ")[1].split("/").map(num => parseInt(num, 10));
  return new Date(year, month - 1, day); // Month is 0-based in JavaScript
}

function renderCalendar(folders) {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  folders.forEach((folder) => {
    const card = document.createElement("div");
    card.className = "bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer";
    card.innerHTML = `<div class="p-4 text-center text-lg font-semibold">${folder.name}</div>`;
    card.addEventListener("click", () => loadGallery(folder.id));
    calendar.appendChild(card);
  });
}

async function loadGallery(folderId) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,thumbnailLink,webViewLink)&key=AIzaSyC...`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await res.json();
    const fileGallery = document.getElementById("file-gallery");
    fileGallery.innerHTML = "";

    if (data.files.length === 0) {
      fileGallery.innerHTML = "<p class='col-span-full text-center'>No hay archivos en esta carpeta.</p>";
      return;
    }

    data.files.forEach((file) => {
      const card = document.createElement("div");
      card.className = "bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200";

      const link = document.createElement("a");
      link.href = file.webViewLink;
      link.target = "_blank";

      const img = document.createElement("img");
      img.src = file.thumbnailLink || "https://via.placeholder.com/150";
      img.alt = file.name;
      img.className = "w-full h-40 object-cover";

      const caption = document.createElement("div");
      caption.className = "p-2 text-center text-sm font-medium text-gray-700";
      caption.innerText = file.name;

      link.appendChild(img);
      card.appendChild(link);
      card.appendChild(caption);
      fileGallery.appendChild(card);
    });

    // Ocultamos el calendario y mostramos la galería
    document.getElementById("calendar").classList.add("hidden");
    document.getElementById("gallery").classList.remove("hidden");
  } catch (error) {
    console.error("Error al cargar los archivos: ", error);
  }
}

function showCalendar() {
  document.getElementById("calendar").classList.remove("hidden");
  document.getElementById("gallery").classList.add("hidden");
}
