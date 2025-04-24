const CLIENT_ID = "36321363025-d2065951vh677c84bn1ofh4dko5fese2.apps.googleusercontent.com";
const FOLDER_ID = "12W81Xq8P2o7HzHQ_sIYQKIAm7aqa3BX6"; // ID de la carpeta principal
const SCOPES = "https://www.googleapis.com/auth/drive.file";

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
  const storedToken = localStorage.getItem("google_access_token");

  if (storedToken) {
    accessToken = storedToken;
    loadFolders();
    document.getElementById("back-to-calendar-button").style.display = "inline-block";
  } else {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        accessToken = tokenResponse.access_token;
        localStorage.setItem("google_access_token", accessToken);
        loadFolders();
        document.getElementById("back-to-calendar-button").style.display = "inline-block";
      },
    });
  }

  // Subir imagen cuando el formulario se envíe
  document.getElementById("uploadImageForm").addEventListener("submit", uploadImage);
};

async function uploadImage(event) {
  event.preventDefault();

  const fileInput = document.getElementById("imageInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Por favor, selecciona una imagen.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: buildRequestBody(file),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const fileId = data.id;
    await addFileToFolder(fileId);

    document.getElementById("uploadStatus").innerHTML = `<p class="text-success">¡Imagen subida con éxito!</p>`;
  } catch (error) {
    console.error("Error al subir la imagen: ", error);
    document.getElementById("uploadStatus").innerHTML = `<p class="text-danger">Hubo un error al subir la imagen.</p>`;
  }
}

// Función para construir el cuerpo de la solicitud de subida
function buildRequestBody(file) {
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [FOLDER_ID], // Aquí añadimos la carpeta donde vamos a guardar el archivo
  };

  const formData = new FormData();
  formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  formData.append("file", file);

  return formData;
}

// Función para añadir el archivo a la carpeta especificada
async function addFileToFolder(fileId) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${FOLDER_ID}&fields=id,parents`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await res.json();
  console.log("Archivo añadido a la carpeta: ", data);
}

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
  return new Date(year, month - 1, day);
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

    document.getElementById("calendar").classList.add("d-none");
    document.getElementById("gallery").classList.remove("hidden");
  } catch (error) {
    console.error("Error al cargar los archivos: ", error);
  }
}

function showCalendar() {
  document.getElementById("calendar").classList.remove("d-none");
  document.getElementById("gallery").classList.add("hidden");
}
