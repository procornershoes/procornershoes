document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. Pagination / Load More Setup
  // ==========================================
  const products = document.querySelectorAll(".product-card");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  let currentItems = 12;

  function updatePagination() {
    products.forEach((item, index) => {
      if (index >= currentItems) {
        item.style.display = "none";
      } else {
        item.style.display = "";
      }
    });

    if (loadMoreBtn) {
      if (currentItems >= products.length) {
        loadMoreBtn.style.display = "none";
      } else {
        loadMoreBtn.style.display = "block";
      }
    }
  }

  // التهيئة الأولية لزر المزيج
  if (products.length > 0) {
    updatePagination();
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      currentItems += 12;
      updatePagination();
    });
  }

  // ==========================================
  // 2. Product Search Logic
  // ==========================================
  const productCards = Array.from(document.querySelectorAll(".product-card"));
  const searchInput = document.getElementById("productSearch");
  const searchDropdown = document.getElementById("searchDropdown");
  const searchForm = document.querySelector(".search-form");
  const clearButton = document.querySelector(".search-clear");

  // إذا لم تكن عناصر البحث موجودة، يتوقف الجزء الخاص بالبحث فقط دون تعطيل باقي الموقع
  if (!searchInput || !searchDropdown) return;

  let debounceTimer = null;
  let selectedIndex = -1;

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightText(text, query) {
    if (!query) return escapeHtml(text);
    const safeQuery = escapeRegExp(query.trim());
    const pattern = new RegExp(`(${safeQuery})`, "ig");
    return escapeHtml(text).replace(pattern, "<mark>$1</mark>");
  }

  function buildProductsData() {
    return productCards.map((card, index) => {
      const title =
        card.querySelector("h3")?.textContent?.trim() || `Product ${index + 1}`;
      const firstLink = card.querySelector("a[href]");
      const firstImage = card.querySelector("img");

      const url = firstLink ? firstLink.getAttribute("href") : "#";
      const imageSrc = firstImage ? firstImage.getAttribute("src") : "";
      const imageAlt = firstImage ? firstImage.getAttribute("alt") : "";

      const searchableText = normalizeText([title, imageAlt, url].join(" "));

      return {
        id: index,
        name: title,
        url,
        imageSrc,
        imageAlt,
        card,
        searchableText,
      };
    });
  }

  const productsData = buildProductsData();

  function closeDropdown() {
    searchDropdown.classList.remove("is-open");
    selectedIndex = -1;
  }

  function renderResults(query) {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      closeDropdown();
      updatePagination();
      return;
    }

    const results = productsData.filter((product) =>
      product.searchableText.includes(normalizedQuery),
    );

    if (!results.length) {
      searchDropdown.innerHTML = `
        <div class="search-empty-state">
          <p>لا توجد نتائج مطابقة</p>
        </div>
      `;
      searchDropdown.classList.add("is-open");
      selectedIndex = -1;
      productsCardsHideAll();
      return;
    }

    filterPageCards(results);

    searchDropdown.innerHTML = `
      <div class="search-dropdown-header">النتائج (${results.length})</div>
      ${results
        .map(
          (product, index) => `
        <button type="button" class="search-result-item" data-url="${escapeHtml(product.url)}" data-index="${index}">
          <img src="${escapeHtml(product.imageSrc)}" alt="${escapeHtml(product.name)}" />
          <div class="search-result-info">
            <div class="search-result-title">${highlightText(product.name, query)}</div>
          </div>
          <i class="fa-solid fa-arrow-left" style="color:#6b7280;font-size:14px;"></i>
        </button>
      `,
        )
        .join("")}
    `;

    searchDropdown.classList.add("is-open");
    selectedIndex = -1;
  }

  function filterPageCards(matchedProducts) {
    const matchedSet = new Set(matchedProducts.map((p) => p.card));
    productCards.forEach((card) => {
      card.style.display = matchedSet.has(card) ? "" : "none";
    });
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
  }

  function productsCardsHideAll() {
    productCards.forEach((card) => (card.style.display = "none"));
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
  }

  function moveSelection(direction) {
    const items = searchDropdown.querySelectorAll(".search-result-item");
    if (!items.length) return;

    const nextIndex = selectedIndex + direction;
    const safeIndex =
      nextIndex < 0
        ? items.length - 1
        : nextIndex >= items.length
          ? 0
          : nextIndex;

    items.forEach((item, index) => {
      item.classList.toggle("is-active", index === safeIndex);
    });

    selectedIndex = safeIndex;

    if (items[safeIndex]) {
      items[safeIndex].scrollIntoView({ block: "nearest" });
    }
  }

  function openSelectedProduct() {
    const items = searchDropdown.querySelectorAll(".search-result-item");
    if (!items.length) return;

    const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : items[0];
    if (!selectedItem) return;

    const targetUrl = selectedItem.getAttribute("data-url");
    if (targetUrl && targetUrl !== "#") {
      window.location.href = targetUrl;
    }
  }

  function handleSearchInput() {
    const query = searchInput.value;
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      if (!query.trim()) {
        closeDropdown();
        updatePagination();
        return;
      }
      renderResults(query);
    }, 200);
  }

  searchInput.addEventListener("input", handleSearchInput);

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim()) {
      renderResults(searchInput.value);
    }
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(-1);
    } else if (event.key === "Enter") {
      if (searchDropdown.classList.contains("is-open")) {
        event.preventDefault();
        openSelectedProduct();
      }
    } else if (event.key === "Escape") {
      closeDropdown();
    }
  });

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (searchInput.value.trim()) {
        renderResults(searchInput.value);
      } else {
        closeDropdown();
        updatePagination();
      }
    });
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      searchInput.value = "";
      closeDropdown();
      updatePagination();
      searchInput.focus();
    });
  }

  document.addEventListener("click", (event) => {
    if (
      (!searchForm || !searchForm.contains(event.target)) &&
      !searchDropdown.contains(event.target)
    ) {
      closeDropdown();
    }
  });

  searchDropdown.addEventListener("click", (event) => {
    const resultItem = event.target.closest(".search-result-item");
    if (!resultItem) return;

    const targetUrl = resultItem.getAttribute("data-url");
    if (targetUrl && targetUrl !== "#") {
      window.location.href = targetUrl;
    }
  });
});
