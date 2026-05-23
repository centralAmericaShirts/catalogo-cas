/* ==========================================================================
   1. CONFIGURACIÓN Y VARIABLES GLOBALES (Compartidas por los html)
   ========================================================================== */
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyobnIVz9rLnotfsSGJA7TmOFpla9VXqBL5UbAEvKsdzxVCCdFkj1KI-gQayOUlhGEMpA/exec"; 
const WS_NUMBER = "+50258656376"; // Número de WhatsApp de la tienda

let allItems = [];
let filteredItems = [];
let currentPage = 1;
let itemsPerPage = 24; 
let currentCategory = "Todas las Prendas"; // Estado de la categoría seleccionada
let currentItem = null;
let editDirty = false;
let addImages = [];
let editImages = [];
let isLoading = true;

// Helper para seleccionar elementos como en jQuery
const $ = (id) => document.getElementById(id);

function ensurePageLoader() {
  let overlay = $('pageLoadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'pageLoadingOverlay';
    overlay.className = 'page-loading-overlay active';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.innerHTML = `
      <img src="assets/loading_gif.gif" alt="" class="page-loading-gif">
      <div class="page-loading-text">cargando</div>
    `;
    document.body.prepend(overlay);
  }
  return overlay;
}

function showPageLoader() {
  ensurePageLoader().classList.add('active');
  document.body.classList.add('page-is-loading');
}

function hidePageLoader() {
  const overlay = $('pageLoadingOverlay');
  if (overlay) overlay.classList.remove('active');
  document.body.classList.remove('page-is-loading');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

/* ==========================================================================
   2. ENRUTADOR AUTOMÁTICO (Detecta la página actual al cargar)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    setupSideMenu();

    // Si el body tiene la clase de la tienda (index.html)
    if (document.body.classList.contains('index-page')) {
        hidePageLoader();
        setupCategoryButtons(); 
        restoreCatalogStateFromUrl();
        loadInventory(); 
        
        // Listener para cerrar modal de producto al hacer clic afuera
        window.addEventListener('click', function(e) {
            const modal = $('productModal');
            if (e.target === modal) {
                closeProductModal();
            }
        });
    } 
    // Si el body tiene la clase de administración (admin.html)
    else if (document.body.classList.contains('admin-page')) {
        hidePageLoader();
        setupDragAndDrop();
        setupAdminForms();
    } 
    // Si el body tiene la clase de producto individual (product.html)
    else if (document.body.classList.contains('product-page')) {
        showPageLoader();
        loadProductPage();
    }
    else {
        hidePageLoader();
    }
});

function setupSideMenu() {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSideMenu();
  });
}

function openSideMenu() {
  const menu = $('sideMenu');
  const overlay = $('sideMenuOverlay');
  const toggle = document.querySelector('.menu-toggle');
  if (!menu || !overlay) return;

  menu.classList.add('open');
  overlay.classList.add('open');
  menu.setAttribute('aria-hidden', 'false');
  toggle?.setAttribute('aria-expanded', 'true');
}

function closeSideMenu() {
  const menu = $('sideMenu');
  const overlay = $('sideMenuOverlay');
  const toggle = document.querySelector('.menu-toggle');
  if (!menu || !overlay) return;

  menu.classList.remove('open');
  overlay.classList.remove('open');
  menu.setAttribute('aria-hidden', 'true');
  toggle?.setAttribute('aria-expanded', 'false');
}

// Configura los clics en el acordeón del menú lateral
function setupCategoryButtons() {
  const buttons = document.querySelectorAll('.accordion-content a');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remover emojis (como el 🔥) y limpiar espacios para tener el nombre real
      let text = btn.innerText.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "").trim();
      selectCategory(text);
    });
  });
}

/* ==========================================================================
   3. LÓGICA PARA LA TIENDA PRINCIPAL (index.html)
   ========================================================================== */
function showInventoryError(message) {
  $('resultCount').innerText = 'Hubo un error al cargar el inventario.';
  $('catalogGrid').innerHTML = `<div class="catalog-state"><p>${escapeHtml(message)}</p></div>`;
  $('paginationControls').style.display = 'none';
}

function normalizeInventoryPayload(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.inventory)) return data.inventory;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getProductUrl(sku) {
  const url = new URL('product.html', window.location.href);
  url.searchParams.set('sku', sku);
  return url.href;
}

function getProductUrlFromCatalog(sku) {
  const url = new URL(getProductUrl(sku));
  url.searchParams.set('category', currentCategory || 'Todas las Prendas');

  const search = $('searchInput')?.value.trim();
  const size = $('sizeFilter')?.value;
  const type = $('typeFilter')?.value;
  const sort = $('sortOrder')?.value;
  const filtersOpen = !$('advancedFilters')?.hidden;

  if (search) url.searchParams.set('search', search);
  if (size) url.searchParams.set('size', size);
  if (type) url.searchParams.set('type', type);
  if (sort && sort !== 'none') url.searchParams.set('sort', sort);
  if (filtersOpen) url.searchParams.set('filters', '1');

  return url.href;
}

function getProductImages(item) {
  const gallery = item.galeria
    ? (typeof item.galeria === 'string' ? item.galeria.split(',') : item.galeria)
    : [item.imagen || 'assets/image_unavailable.png'];

  const images = gallery.map(src => String(src).trim()).filter(Boolean);
  return images.length ? images : ['assets/image_unavailable.png'];
}

function openProductPage(sku) {
  showPageLoader();
  window.location.href = getProductUrlFromCatalog(sku);
}

function getJsonp(params, timeoutMs = 15000) {
  const cb = 'callback_' + Date.now();
  const script = document.createElement('script');
  const query = new URLSearchParams({ ...params, callback: cb });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('timeout'));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeout);
      delete window[cb];
      script.remove();
    }

    window[cb] = (data) => {
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error('network'));
    };
    script.src = `${WEB_APP_URL}?${query.toString()}`;
    document.body.appendChild(script);
  });
}

async function loadInventory(){
  isLoading = true;
  renderCatalogLoading();
  try {
    const data = await getJsonp({ action: 'getInventory' });
    allItems = normalizeInventoryPayload(data);
    isLoading = false;
    applyFilters();
  } catch(error) {
    isLoading = false;
    const message = error.message === 'timeout'
      ? 'El inventario está tardando demasiado en responder. Intenta recargar la página.'
      : 'Una disculpa. Hubo un problema conectando con la base de datos.';
    showInventoryError(message);
  } finally {
    hidePageLoader();
  }
}

function changePage(delta) {
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  currentPage += delta;
  
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;
  
  render();
  $('resultCount').scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function cleanText(str) {
  return String(str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function cleanOptionText(str) {
  return cleanText(str).replace(/\s+/g, '');
}

function setSelectValue(select, value) {
  if (!select) return;
  const desired = cleanOptionText(value);
  const option = Array.from(select.options).find(opt => cleanOptionText(opt.value) === desired || cleanOptionText(opt.text) === desired);
  select.value = option ? option.value : '';
}

function setFilterPanelOpen(isOpen) {
  const panel = $('advancedFilters');
  const toggle = $('filterToggleBtn');
  if (!panel || !toggle) return;

  panel.hidden = !isOpen;
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.innerText = isOpen ? 'Ocultar filtros' : 'Filtros';
}

function toggleFilterPanel() {
  const panel = $('advancedFilters');
  if (!panel) return;
  setFilterPanelOpen(panel.hidden);
}

function restoreCatalogStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const search = params.get('search');
  const size = params.get('size');
  const type = params.get('type');
  const sort = params.get('sort');
  const category = params.get('category');

  if (search !== null && $('searchInput')) $('searchInput').value = search;
  if (size !== null) setSelectValue($('sizeFilter'), size);
  if (type !== null) setSelectValue($('typeFilter'), type);
  if (sort !== null) setSelectValue($('sortOrder'), sort);

  const hasAdvancedFilters = params.get('filters') === '1' || Boolean(size || type || (sort && sort !== 'none'));
  setFilterPanelOpen(hasAdvancedFilters);

  if (category) {
    selectCategory(category);
  }
}

function applyFilters() {
  if (isLoading) {
    renderCatalogLoading();
    return;
  }

  const search = $('searchInput').value.toLowerCase().trim();
  const size = $('sizeFilter').value;
  const type = $('typeFilter').value;
  const onlyAvail = true;
  const sort = $('sortOrder').value;

  filteredItems = allItems.filter(item => {
    // Filtros básicos
    const matchesSearch = !search || String(item.sku).toLowerCase().includes(search) || String(item.equipo).toLowerCase().includes(search);
    const matchesSize = !size || String(item.talla) === size;
    const matchesType = !type || String(item.tipo) === type;
    const isDisponible = item.disponible === true || String(item.disponible).toUpperCase() === 'SÍ';
    const matchesAvail = !onlyAvail || isDisponible;

    // Lógica de Categorías (Filtrado Inteligente)
    let matchesCategory = true;
    if (currentCategory !== "Todas las Prendas") {
      
      // Limpiamos la categoría seleccionada (quitamos espacios y tildes para comparar)
      const selectedCatClean = cleanText(currentCategory).replace(/\s+/g, '');

      // Caso especial: Ofertas
      if (selectedCatClean === "ofertas") {
        const oferta = item.precioOferta || item.Precio_Oferta;
        matchesCategory = (oferta !== undefined && oferta !== null && oferta !== "" && oferta !== 0);
      } 
      else {
        // Limpiamos el valor del item (quitamos espacios y tildes)
        const itemRegionRaw = item.tipoRegion || item.tipo_region || item.Tipo_Region || item.TipoRegion || "";
        const itemRegionClean = cleanText(itemRegionRaw).replace(/\s+/g, '');

        if (selectedCatClean === "selecciones") {
          matchesCategory = (itemRegionClean === "seleccion" || itemRegionClean === "selecciones");
        } 
        else if (selectedCatClean === "equiposeuropeos" || selectedCatClean === "europa") {
          matchesCategory = (itemRegionClean === "europa" || itemRegionClean === "equiposeuropeos");
        } 
        // Aquí detectará "conmebol/concacaf" aunque el usuario elija "Conmebol / Concacaf"
        else if (selectedCatClean === "conmebol/concacaf") {
          matchesCategory = (itemRegionClean === "conmebol/concacaf");
        } 
        else {
          matchesCategory = (itemRegionClean === selectedCatClean || itemRegionClean.includes(selectedCatClean));
        }
      }
    }

    return matchesSearch && matchesSize && matchesType && matchesAvail && matchesCategory;
  });

  // Ordenamiento
  if (sort === 'p-low') filteredItems.sort((a, b) => Number(a.precio) - Number(b.precio));
  if (sort === 'p-high') filteredItems.sort((a, b) => Number(b.precio) - Number(a.precio));
  if (sort === 'az') filteredItems.sort((a, b) => a.equipo.localeCompare(b.equipo));
  if (sort === 'za') filteredItems.sort((a, b) => b.equipo.localeCompare(a.equipo));

  currentPage = 1;
  render();
}

function render() {
  const grid = document.getElementById('catalogGrid');

  if (!grid) return;

  if (filteredItems.length === 0) {
    renderEmptyCatalog();
    return;
  }

  document.getElementById('resultCount').innerText = `${filteredItems.length} prendas encontradas`;

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filteredItems.slice(start, end);

  grid.innerHTML = pageItems.map(item => {
    const images = getProductImages(item);
    
    const priceHTML = getProductPriceHtml(item, 14);

    // Lógica para el botón directo de WhatsApp
    const wsMessage = `¡Hola! Me interesa la camisola de ${item.equipo} (Talla: ${item.talla}, SKU: ${item.sku}) que vi en su catálogo web. ¿Está disponible?`;
    const wsUrl = `https://wa.me/${WS_NUMBER.replace('+', '')}?text=${encodeURIComponent(wsMessage)}`;

    return `
      <div class="product-card" data-sku="${escapeHtml(item.sku)}" role="link" tabindex="0" style="cursor:pointer; border: 1px solid #1f3350; border-radius: 12px; overflow: hidden; background: #0a1728; transition: transform 0.2s;">
        <div class="product-image-wrapper" style="width: 100%; height: 280px; overflow: hidden; background: #07111f;">
          <img src="${escapeHtml(images[0])}" alt="${escapeHtml(item.equipo)}" loading="lazy" onerror="this.onerror=null; this.src='assets/image_unavailable.png';" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div class="product-info" style="padding: 15px;">
          <div class="product-sku" style="color: #9eb1ca; font-size: 12px; margin-bottom: 5px;">${escapeHtml(item.sku)}</div>
          <h3 class="product-title" style="color: #fff; margin-bottom: 5px; font-size: 16px;">${escapeHtml(item.equipo)}</h3>
          <div class="product-meta" style="color: #d9e5f5; font-size: 13px; margin-bottom: 10px;">Talla: ${escapeHtml(item.talla)} | ${escapeHtml(item.tipo)}</div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
            <div class="product-price" style="color: #2490ff; font-size: 18px; font-weight: bold;">
              ${priceHTML}
            </div>
            <a href="${wsUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation();" aria-label="Consultar por WhatsApp" style="display: flex; align-items: center; justify-content: center; background: #25D366; border-radius: 8px; width: 34px; height: 34px; flex-shrink: 0; transition: opacity 0.2s;">
              <img src="whatsapp_logo.jpg" alt="WhatsApp" style="width: 20px; height: 20px;">
            </a>
          </div>

        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', event => {
      if (event.target.closest('a')) return;
      openProductPage(card.dataset.sku);
    });
    card.addEventListener('keydown', event => {
      if (event.target.closest('a')) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProductPage(card.dataset.sku);
      }
    });
  });

  if (totalPages > 1) {
    document.getElementById('paginationControls').style.display = 'flex';
    document.getElementById('pageIndicator').innerText = `${currentPage} de ${totalPages}`;
    document.getElementById('prevPageBtn').disabled = (currentPage === 1);
    document.getElementById('nextPageBtn').disabled = (currentPage === totalPages);
  } else {
    document.getElementById('paginationControls').style.display = 'none';
  }
}

function renderCatalogLoading() {
  const grid = $('catalogGrid');
  const resultCount = $('resultCount');
  const pagination = $('paginationControls');
  if (resultCount) resultCount.innerText = 'Cargando prendas...';
  if (pagination) pagination.style.display = 'none';
  if (!grid) return;

  grid.innerHTML = `
    <div class="catalog-state">
      <img src="assets/loading_gif.gif" alt="">
      <p>cargando</p>
    </div>
  `;
}

function renderEmptyCatalog() {
  const grid = $('catalogGrid');
  const resultCount = $('resultCount');
  const pagination = $('paginationControls');
  if (resultCount) resultCount.innerText = '0 resultados';
  if (pagination) pagination.style.display = 'none';
  if (!grid) return;

  grid.innerHTML = `
    <div class="catalog-state empty">
      <img src="nothing_to_see_here.png" alt="">
      <p>Parece que no hay nada por aqui</p>
    </div>
  `;
}

/* ==========================================================================
   NUEVAS FUNCIONES: NAVEGACIÓN DE CUADROS DE CATEGORÍAS (index.html)
   ========================================================================== */
function selectCategory(categoryName) {
  if (categoryName.toLowerCase() === "todas las prendas") {
    currentCategory = "Todas las Prendas";
  } else {
    currentCategory = categoryName;
  }

  const titleEl = $('currentCategoryTitle');
  if (titleEl) titleEl.innerText = currentCategory;

  $('categoryGrid').style.display = 'none';
  $('inventorySection').style.display = 'block';

  // Ocultar o mostrar el cintillo superior de imágenes
  const slider = document.querySelector('.slider-container');
  if (slider) {
    if (currentCategory === "Todas las Prendas") {
      slider.style.display = "block";
    } else {
      slider.style.display = "none";
    }
  }

  applyFilters();
}

function backToCategories() {
  $('categoryGrid').style.display = 'grid';
  $('inventorySection').style.display = 'none';

  const slider = document.querySelector('.slider-container');
  if (slider) slider.style.display = "block";
  
  // Limpiar filtros al regresar por comodidad del usuario
  $('searchInput').value = '';
  $('sizeFilter').value = '';
  $('typeFilter').value = '';
  $('sortOrder').value = 'none';
  setFilterPanelOpen(false);
}

/* ==========================================================================
   4. MODAL DETALLADO DE PRODUCTOS (index.html)
   ========================================================================== */
function openProductModal(item) {
  const modal = $('productModal');
  if (!modal) return;

  const images = getProductImages(item);
  $('modalTitle').innerText = item.equipo;
  $('modalPrice').innerText = `Q${item.precio}`;
  $('modalSize').innerText = item.talla;
  $('modalType').innerText = item.tipo;
  $('modalSku').innerText = item.sku;
  $('modalNotes').innerText = item.notas || 'Sin descripción adicional.';

  const mainImg = $('modalMainImage');
  mainImg.src = images[0];
  mainImg.onerror = () => {
    mainImg.onerror = null;
    mainImg.src = 'assets/image_unavailable.png';
  };

  const thumbsContainer = $('modalThumbnails');
  thumbsContainer.innerHTML = '';

  if (images.length > 1) {
    images.forEach((src, idx) => {
      const thumb = document.createElement('img');
      thumb.src = src;
      thumb.onerror = () => {
        thumb.onerror = null;
        thumb.src = 'assets/image_unavailable.png';
      };
      thumb.style.cssText = "width:60px; height:60px; object-fit:contain; border:2px solid #1f3350; border-radius:8px; cursor:pointer; background:#0a1728; flex-shrink:0;";
      if (idx === 0) thumb.style.borderColor = "#2490ff";
      
      thumb.onclick = () => {
        mainImg.src = src;
        Array.from(thumbsContainer.children).forEach(t => t.style.borderColor = "#1f3350");
        thumb.style.borderColor = "#2490ff";
      };
      thumbsContainer.appendChild(thumb);
    });
    thumbsContainer.style.display = 'flex';
  } else {
    thumbsContainer.style.display = 'none';
  }

  // Generar enlace estructurado para WhatsApp
  const message = `¡Hola! Me interesa la camisola de ${item.equipo} (Talla: ${item.talla}, SKU: ${item.sku}) que vi en su catálogo web. ¿Está disponible?`;
  $('modalWsBtn').href = `https://wa.me/${WS_NUMBER.replace('+', '')}?text=${encodeURIComponent(message)}`;
  $('modalFullPageBtn').href = getProductUrlFromCatalog(item.sku);

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  const modal = $('productModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

/* ==========================================================================
   5. VISTA DE PRODUCTO INDIVIDUAL (product.html)
   ========================================================================== */
async function loadProductPage() {
  showPageLoader();
  const params = new URLSearchParams(window.location.search);
  const sku = params.get('sku');
  
  if (!sku) {
    showProductPageError("No se especificó ningún SKU en la dirección web. Por favor, selecciona una prenda desde el catálogo.");
    hidePageLoader();
    return;
  }

  try {
    const response = await getJsonp({ action: 'getSku', sku: sku });
    
    // Extract the item object securely
    if (!response || response.success === false || !response.item) {
      showProductPageError("La camisola solicitada no existe, fue eliminada o ya fue vendida.");
      return;
    }
    
    const itemData = response.item;
    renderProductPage(itemData, sku);

  } catch (err) {
    showProductPageError("Error de conexión al cargar los datos de la prenda.");
  } finally {
    hidePageLoader();
  }
}

function getProductPriceHtml(item, regularSize = 18) {
  const oferta = item.precioOferta || item.Precio_Oferta;
  const hasSale = oferta !== undefined && oferta !== null && String(oferta).trim() !== "" && Number(oferta) !== 0;
  if (hasSale) {
    return `<span style="text-decoration: line-through; color: #9eb1ca; font-size: ${regularSize}px; margin-right: 10px;">Q${escapeHtml(item.precio)}</span>Q${escapeHtml(oferta)}`;
  }
  return `Q${escapeHtml(item.precio || '0.00')}`;
}

function productDetailRow(label, value) {
  const displayValue = value !== undefined && value !== null && String(value).trim() !== '' ? value : 'N/A';
  return `
    <div class="product-detail-row">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(displayValue)}</dd>
    </div>
  `;
}

function renderProductPage(item, requestedSku) {
  const content = $('productPageContent');
  if (!content) return;

  const images = getProductImages(item);
  const title = item.equipo || 'Equipo Desconocido';
  const sku = item.sku || requestedSku;
  const notes = item.notas || 'Sin descripción adicional.';
  const region = item.tipoRegion || item.tipo_region || item.Tipo_Region || item.TipoRegion || '';
  const availability = item.disponible === true || String(item.disponible).toUpperCase() === 'SÍ' ? 'Disponible' : 'No disponible';
  const status = item.estado || 'Activo';
  const message = `¡Hola! Me interesa la camisola de ${title} (Talla: ${item.talla || ''}, SKU: ${sku}) que vi en su catálogo web. ¿Está disponible?`;
  const wsUrl = `https://wa.me/${WS_NUMBER.replace('+', '')}?text=${encodeURIComponent(message)}`;
  const returnUrl = getCatalogReturnUrl();

  document.title = `${title} | CAS`;
  content.innerHTML = `
    <div class="product-page-actions">
      <a href="${escapeHtml(returnUrl)}" class="secondary-btn" style="text-decoration:none;">← Regresar</a>
      <a href="index.html" class="secondary-btn" style="text-decoration:none;">Ver todas las categorías</a>
    </div>
    <section class="product-detail" aria-label="Detalle de prenda">
      <div class="product-gallery-panel">
        <div class="product-main-image-frame">
          <img id="mainProductImage" src="${escapeHtml(images[0])}" alt="${escapeHtml(title)}" onerror="this.onerror=null; this.src='assets/image_unavailable.png';">
        </div>
        <div id="productThumbnails" class="product-thumbnails${images.length <= 1 ? ' is-hidden' : ''}" aria-label="Galería de imágenes"></div>
      </div>
      <div class="product-info-panel">
        <p class="product-page-sku">${escapeHtml(sku)}</p>
        <h1 id="productTitle">${escapeHtml(title)}</h1>
        <div id="productPrice" class="product-page-price">${getProductPriceHtml(item, 18)}</div>
        <dl class="product-detail-list">
          ${productDetailRow('SKU', sku)}
          ${productDetailRow('Talla', item.talla)}
          ${productDetailRow('Tipo', item.tipo)}
          ${productDetailRow('Año', item.year)}
          ${region ? productDetailRow('Categoría', region) : ''}
          ${productDetailRow('Disponibilidad', availability)}
          ${productDetailRow('Estado', status)}
        </dl>
        <div class="product-notes">
          <h2>Descripción / Notas</h2>
          <p>${escapeHtml(notes)}</p>
        </div>
        <div class="product-actions">
          <a id="productWsLink" href="${escapeHtml(wsUrl)}" class="ws-detail-btn" target="_blank" rel="noopener">
            <img src="whatsapp_logo.jpg" alt="">
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  `;

  const mainImg = $('mainProductImage');
  const thumbsContainer = $('productThumbnails');
  if (mainImg) {
    mainImg.onerror = () => {
      mainImg.onerror = null;
      mainImg.src = 'assets/image_unavailable.png';
    };
  }
  if (!mainImg || !thumbsContainer || images.length <= 1) return;

  images.forEach((src, idx) => {
    const thumb = document.createElement('img');
    thumb.src = src;
    thumb.alt = `${title} ${idx + 1}`;
    thumb.className = 'product-thumb' + (idx === 0 ? ' active' : '');
    thumb.onerror = () => {
      thumb.onerror = null;
      thumb.src = 'assets/image_unavailable.png';
    };
    thumb.addEventListener('click', () => {
      mainImg.src = src;
      Array.from(thumbsContainer.children).forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
    thumbsContainer.appendChild(thumb);
  });
}

function getCatalogReturnUrl() {
  const params = new URLSearchParams(window.location.search);
  const url = new URL('index.html', window.location.href);
  const passthrough = ['category', 'search', 'size', 'type', 'sort', 'filters'];

  if (!params.has('category')) {
    url.searchParams.set('category', 'Todas las Prendas');
  }

  passthrough.forEach(key => {
    const value = params.get(key);
    if (value !== null && value !== '') url.searchParams.set(key, value);
  });

  return url.href;
}

function showProductPageError(msg) {
  const content = $('productPageContent');
  if (content) {
    content.style.display = 'block';
    content.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #ff4d4d; background: #0a1728; border-radius: 12px; border: 1px solid #1f3350;">
        <h2 style="margin-bottom: 15px;">Error al cargar la prenda</h2>
        <p style="color: #d9e5f5; font-size: 16px; margin-bottom: 20px;">${escapeHtml(msg)}</p>
        <a href="index.html" class="secondary-btn" style="text-decoration: none; display: inline-block;">Volver al catálogo</a>
      </div>
    `;
  }
}

/* ==========================================================================
   6. PANEL DE ADMINISTRACIÓN (admin.html) - ENVÍOS POST Y BASE64
   ========================================================================== */
function showLoader(text) {
  $('loaderText').innerText = text || "Procesando...";
  $('loaderOverlay').classList.add('active');
}

function hideLoader() {
  $('loaderOverlay').classList.remove('active');
}

function setupDragAndDrop() {
  const pairs = [
    { zoneId: "addDropZone", fileId: "addFileInput", imagesArray: addImages, previewId: "addPreviewContainer", uploadId: "addUploadContainer" },
    { zoneId: "editDropZone", fileId: "editFileInput", imagesArray: editImages, previewId: "editPreviewContainer", uploadId: "editUploadContainer" }
  ];

  pairs.forEach(p => {
    const zone = $(p.zoneId);
    const input = $(p.fileId);
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files, p);
      }
    });
  });
}

function handleFiles(files, config) {
  const filesArray = Array.from(files).filter(file => file.type.startsWith('image/'));
  if (!filesArray.length) return;
  let loadedCount = 0;

  filesArray.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Redimensionar y comprimir la imagen en el canvas antes de mandarla
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 1200;

        if (width > height) {
          if (width > max_size) { height *= max_size / width; width = max_size; }
        } else {
          if (height > max_size) { width *= max_size / height; height = max_size; }
        }
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64Str = canvas.toDataURL('image/jpeg', 0.75);
        config.imagesArray.push({ base64: base64Str, name: file.name, type: 'image/jpeg' });
        
        loadedCount++;
        if (loadedCount === filesArray.length) {
          renderPreviews(config);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderPreviews(config) {
  const container = $(config.previewId);
  const uploadBox = $(config.uploadId);
  if (!container) return;

  container.innerHTML = config.imagesArray.map((img, idx) => `
    <div class="preview-card" style="position:relative; display:inline-block; margin:5px;">
      <img src="${img.base64}" style="width:80px; height:80px; object-fit:cover; border-radius:8px; border:1px solid #1f3350;">
      <span onclick="removeImageAt(${idx}, '${config.previewId}')" style="position:absolute; top:-6px; right:-6px; background:#ff4a4a; color:#fff; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; cursor:pointer; font-weight:bold;">&times;</span>
    </div>
  `).join('');

  if (config.imagesArray.length > 0) {
    container.classList.remove('hidden');
    uploadBox.classList.add('hidden');
  } else {
    container.classList.add('hidden');
    uploadBox.classList.remove('hidden');
  }
  if (config.markDirty !== false) markEditDirty();
}

function renderCurrentImages(images) {
  const container = $('editCurrentImages');
  if (!container) return;
  const visibleImages = images.filter(Boolean);
  container.innerHTML = visibleImages.map(src => `
    <img src="${escapeHtml(src)}" alt="Imagen actual" onerror="this.onerror=null; this.src='assets/image_unavailable.png';">
  `).join('');
  container.classList.toggle('hidden', visibleImages.length === 0);
}

function removeImageAt(index, previewContainerId) {
  if (previewContainerId === 'addPreviewContainer') {
    addImages.splice(index, 1);
    renderPreviews({ imagesArray: addImages, previewId: "addPreviewContainer", uploadId: "addUploadContainer" });
  } else {
    editImages.splice(index, 1);
    renderPreviews({ imagesArray: editImages, previewId: "editPreviewContainer", uploadId: "editUploadContainer" });
  }
}

function setupAdminForms() {
  $("addForm")?.addEventListener("submit", submitAdd);
  $("editForm")?.addEventListener("submit", submitEdit);
  $("editForm")?.addEventListener("input", markEditDirty);
  $("editForm")?.addEventListener("change", markEditDirty);
  $("addFileInput")?.addEventListener("change", (e) => {
    if(e.target.files.length) {
      handleFiles(e.target.files, { imagesArray: addImages, previewId: "addPreviewContainer", uploadId: "addUploadContainer" });
    }
  });
  $("editFileInput")?.addEventListener("change", (e) => {
    if(e.target.files.length) {
      handleFiles(e.target.files, { imagesArray: editImages, previewId: "editPreviewContainer", uploadId: "editUploadContainer" });
    }
  });
}

function markEditDirty() {
  editDirty = true;
  const confirmBtn = $("confirmUpdateBtn");
  if (confirmBtn) confirmBtn.disabled = false;
}

function getUploadImages(images) {
  return images.filter(img => String(img.base64 || '').startsWith('data:image/'));
}

async function sendPostRequest(payload) {
  return fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function submitAdd(e) {
  e.preventDefault();
  const btn = e.submitter || document.querySelector("#addForm button[type='submit']");
  btn.disabled = true;
  showLoader("Subiendo camisola al inventario de Sheets...");

  const formData = new FormData(e.target);
  
  // Note: We changed action to 'addItem' to match code.gs
  // and added the missing year, precioOferta, and disponible fields.
  const payload = {
    action: "addItem", 
    equipo: formData.get("equipo"),
    year: formData.get("year"),
    precio: formData.get("precio"),
    precioOferta: formData.get("precio_oferta"),
    talla: formData.get("talla"),
    tipo: formData.get("tipo"),
    disponible: formData.get("venta") !== null, // Checkbox returns null if unchecked
    tipoRegion: formData.get("tipo_region"), // Matches the name in HTML
    notas: formData.get("notas"),
    images: getUploadImages(addImages)
  };

  try {
    await sendPostRequest(payload);
    alert("¡Prenda subida exitosamente con sus imágenes!");
    e.target.reset();
    addImages = [];
    renderPreviews({ imagesArray: addImages, previewId: "addPreviewContainer", uploadId: "addUploadContainer" });
    closeAddModal();
  } catch (err) {
    alert("Error de conexión al enviar.");
  }
  hideLoader();
  btn.disabled = false;
}

async function lookupSku() {
  // Convert search to uppercase to match how SKUs are stored
  const sku = $("lookupSku").value.trim().toUpperCase(); 
  if (!sku) return;

  showLoader("Buscando código SKU...");
  try {
    const response = await getJsonp({ action: 'getSku', sku: sku });
    
    // Check if the item was found correctly
    if (!response || response.success === false || !response.item) {
      $("manageStatus").innerText = "Código SKU no encontrado o hubo un error de conexión.";
      resetManageExceptSku();
    } else {
      const itemData = response.item; 
      currentItem = itemData;
      
      $("manageStatus").innerText = "Prenda cargada con éxito.";
      
      // Get images for the visual summary
      const images = getProductImages(itemData);
      const mainImage = images.length > 0 ? images[0] : 'assets/image_unavailable.png';
      
      // Create a visual card similar to the product popup
      let summaryHtml = `
        <div style="display:flex; flex-wrap:wrap; gap:20px; background:#0a1728; padding:20px; border-radius:12px; border:1px solid #1f3350; margin-top:15px; margin-bottom:20px;">
          <div style="width: 140px; flex-shrink: 0; background: #07111f; padding: 10px; border-radius: 8px;">
            <img src="${escapeHtml(mainImage)}" onerror="this.onerror=null; this.src='assets/image_unavailable.png';" style="width:100%; height:auto; object-fit:contain; border-radius:4px;">
          </div>
          <div style="flex:1; min-width: 200px; display: flex; flex-direction: column; justify-content: center;">
            <h3 style="color:#2490ff; margin:0 0 10px 0; font-size: 22px;">${escapeHtml(itemData.equipo)}</h3>
            <div style="font-size: 20px; font-weight: bold; color: #fff; margin-bottom: 15px;">Q${escapeHtml(itemData.precio)}</div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size:15px; color:#d9e5f5;">
              <div><strong>SKU:</strong> ${escapeHtml(itemData.sku)}</div>
              <div><strong>Talla:</strong> ${escapeHtml(itemData.talla)}</div>
              <div><strong>Tipo:</strong> ${escapeHtml(itemData.tipo)}</div>
              <div><strong>Disponibilidad:</strong> ${itemData.disponible ? 'SÍ' : 'NO'}</div>
              <div style="grid-column: 1 / -1;">
                <strong>Estado:</strong> 
                <span style="color: ${itemData.estado === 'Activo' ? '#25D366' : '#ff4a4a'}; font-weight: bold;">
                  ${escapeHtml(itemData.estado || 'Activo')}
                </span>
              </div>
            </div>
          </div>
        </div>
      `;
      
      $("skuSummary").innerHTML = summaryHtml;
      $("skuSummary").classList.remove("hidden");

      // Fill the hidden edit form fields so "Actualizar" has the right data
      const form = $("editForm");
      form.sku.value = itemData.sku;
      form.equipo.value = itemData.equipo;
      form.year.value = itemData.year || ""; 
      form.precio.value = itemData.precio;
      form.precio_oferta.value = itemData.precioOferta || itemData.Precio_Oferta || ""; 
      setSelectValue(form.talla, itemData.talla);
      setSelectValue(form.tipo, itemData.tipo);
      form.venta.checked = itemData.disponible === true || String(itemData.disponible).toUpperCase() === 'SÍ'; 
      setSelectValue(form.tipo_region, itemData.tipoRegion || itemData.tipo_region || itemData.Tipo_Region || itemData.TipoRegion || "");
      form.notas.value = itemData.notas || "";

      // Render image previews in the edit form
      const currentGallery = getProductImages(itemData);
      editImages = [];
      renderCurrentImages(currentGallery);
      renderPreviews({ imagesArray: editImages, previewId: "editPreviewContainer", uploadId: "editUploadContainer", markDirty: false });

      // Show the action buttons (Actualizar, Marcar Vendida, Eliminar)
      showActions();
    }
  } catch (err) {
    $("manageStatus").innerText = "Error de red al buscar el SKU.";
  }
  hideLoader();
}

function showActions() {
  $("updateBtn").classList.remove("hidden");
  $("soldBtn").classList.remove("hidden");
  $("deleteBtn").classList.remove("hidden");
  $("confirmUpdateBtn").classList.add("hidden");
  $("editForm").classList.add("hidden");
}

function hideActions() {
  $("updateBtn").classList.add("hidden");
  $("soldBtn").classList.add("hidden");
  $("deleteBtn").classList.add("hidden");
  $("confirmUpdateBtn").classList.add("hidden");
}

function showEditForm() {
  $("editForm").classList.remove("hidden");
  $("updateBtn").classList.add("hidden");
  $("confirmUpdateBtn").classList.remove("hidden");
  editDirty = false;
  $("confirmUpdateBtn").disabled = true;
}

async function confirmUpdate() {
  if (!editDirty) return;
  const btn = $("confirmUpdateBtn");
  btn.disabled = true;
  showLoader("Guardando cambios y procesando imágenes en el Excel...");

  const form = $("editForm");
  
  // Changed action to 'updateItem' to match code.gs
  // and added the missing year, precioOferta, and disponible fields.
  const payload = {
    action: "updateItem",
    sku: currentItem.sku, // The original SKU is sent so code.gs can find the correct row
    equipo: form.equipo.value,
    year: form.year.value,
    precio: form.precio.value,
    precioOferta: form.precio_oferta.value,
    talla: form.talla.value,
    tipo: form.tipo.value,
    disponible: form.venta.checked, // Retrieves true/false from the checkbox
    tipoRegion: form.tipo_region.value,
    notas: form.notas.value,
    images: getUploadImages(editImages)
  };

  try {
    await sendPostRequest(payload);
    alert("¡Los datos de la prenda se actualizaron correctamente!");
    closeManageModal();
  } catch (err) {
    alert("Error de conexión al procesar cambios.");
  }
  hideLoader();
  btn.disabled = false;
}

async function submitEdit(e) { e.preventDefault(); }

function openConfirmModal(type) {
  const modal = $("confirmModal");
  const title = $("confirmTitle");
  const text = $("confirmText");
  const actionBtn = $("confirmActionBtn");

  if (type === 'sold') {
    title.innerText = "Marcar Como Vendida";
    text.innerText = `¿Seguro que deseas marcar la camisola SKU: ${currentItem.sku} como VENDIDA? Se ocultará automáticamente de la tienda de clientes.`;
    actionBtn.onclick = () => executeStatusChange('markSold');
  } else if (type === 'delete') {
    title.innerText = "Eliminar Prenda";
    text.innerText = `¿Deseas dar de baja por completo la camisola SKU: ${currentItem.sku} de la base de datos de Google Sheets?`;
    actionBtn.onclick = () => executeStatusChange('markDeleted');
  }
  modal.style.display = 'flex';
}

function closeConfirmModal() {
  $("confirmModal").style.display = 'none';
}

async function executeStatusChange(actionType) {
  closeConfirmModal();
  showLoader("Modificando estado de la fila...");
  try {
    await sendPostRequest({ action: actionType, sku: currentItem.sku });
    alert("El estado de la prenda se modificó correctamente en Google Sheets.");
    closeManageModal();
  } catch (err) {
    alert("Error de red.");
  }
  hideLoader();
}

function openAddModal() { $("addModal").style.display = "flex"; }
function closeAddModal() { $("addModal").style.display = "none"; }
function openManageModal() { $("manageModal").style.display = "flex"; resetManage(); }
function closeManageModal() { $("manageModal").style.display = "none"; resetManage(); }

function resetManage() {
  currentItem = null;
  editDirty = false;
  $("lookupSku").value = "";
  $("manageStatus").innerText = "";
  $("skuSummary").innerHTML = "";
  $("skuSummary").classList.add("hidden");
  $("editForm").reset();
  $("editForm").classList.add("hidden");
  $("editPreviewContainer").innerHTML = "";
  $("editPreviewContainer").classList.add("hidden");
  $("editCurrentImages")?.classList.add("hidden");
  if ($("editCurrentImages")) $("editCurrentImages").innerHTML = "";
  $("editUploadContainer").classList.remove("hidden");
  editImages = [];
  hideActions();
}

function resetManageExceptSku() {
  currentItem = null;
  editDirty = false;
  $("manageStatus").innerText = "";
  $("skuSummary").innerHTML = "";
  $("skuSummary").classList.add("hidden");
  $("editForm").reset();
  $("editForm").classList.add("hidden");
  $("editPreviewContainer").innerHTML = "";
  $("editPreviewContainer").classList.add("hidden");
  $("editCurrentImages")?.classList.add("hidden");
  if ($("editCurrentImages")) $("editCurrentImages").innerHTML = "";
  $("editUploadContainer").classList.remove("hidden");
  editImages = [];
  hideActions();
}
