const CLIENT_ID = "36321363025-d2065951vh677c84bn1ofh4dko5fese2.apps.googleusercontent.com";
const FOLDER_ID = "12W81Xq8P2o7HzHQ_sIYQKIAm7aqa3BX6"; // ID de la carpeta principal
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

let tokenClient;
let accessToken;
let folders = [];

document.getElementById("signin-button").addEventListener("click", () => {
  tokenClient.requestAccessToken();
});

document.getElementById("back-to-calendar-button").addEventListener("click", () => {
  showCalendar();
});

window.onload = () => {
  // Intentamos obtener el token desde localStorage
  const storedToken = localStorage.getItem("google_access_token");

  // Si el token ya está guardado, lo utilizamos
  if (storedToken) {
    accessToken = storedToken;
    loadFolders();
    document.getElementById("back-to-calendar-button").style.display = "inline-block";
  } else {
    // Si no hay token, procedemos con la autenticación
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        // Guardamos el token en localStorage
        accessToken = tokenResponse.access_token;
        localStorage.setItem("google_access_token", accessToken); // Guardamos el token en localStorage
        loadFolders();
        document.getElementById("back-to-calendar-button").style.display = "inline-block";
      },
    });
  }
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
    card.className = "col";

    card.innerHTML = `
      <div class="card shadow-sm p-3 mb-5 bg-white rounded" onclick="loadGallery('${folder.id}')">
        <div class="card-body text-center">
          <h5 class="card-title">${folder.name}</h5>
        </div>
      </div>
    `;
    
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
      card.className = "col";

      card.innerHTML = `
        <div class="card gallery-card">
          <a href="${file.webViewLink}" target="_blank">
            <img src="${file.thumbnailLink || 'https://via.placeholder.com/150'}" class="card-img-top" alt="${file.name}">
          </a>
          <div class="card-body">
            <p class="card-text">${file.name}</p>
          </div>
        </div>
      `;
      
      fileGallery.appendChild(card);
    });

    // Ocultamos el calendario y mostramos la galería
    document.getElementById("calendar").classList.add("d-none");
    document.getElementById("gallery").classList.remove("hidden");
  } catch (error) {
    console.error("Error al cargar los archivos: ", error);
  }
}

function showCalendar() {
  // Mostramos la vista de calendario y ocultamos la galería
  document.getElementById("calendar").classList.remove("d-none");
  document.getElementById("gallery").classList.add("hidden");
}
