(function () {
  "use strict";

  var STORAGE_KEY = "parentCompass_favourites_v1";
  var situations = window.PC_SITUATIONS || [];
  var byId = {};
  situations.forEach(function (s) { byId[s.id] = s; });

  var grid = document.getElementById("situation-grid");
  var panel = document.getElementById("card-panel");
  var favList = document.getElementById("favourites-list");
  var favEmpty = document.getElementById("fav-empty");
  var activeId = null;

  function getFavourites() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(function (id) { return byId[id]; }) : [];
    } catch (e) {
      return [];
    }
  }

  function setFavourites(ids) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) { /* private mode / quota */ }
    syncFavMarks();
    renderFavourites();
  }

  function isFav(id) {
    return getFavourites().indexOf(id) !== -1;
  }

  function toggleFav(id) {
    var favs = getFavourites();
    var i = favs.indexOf(id);
    if (i === -1) favs.push(id);
    else favs.splice(i, 1);
    setFavourites(favs);
    if (activeId === id) renderCard(id);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function listHtml(items, ordered) {
    var tag = ordered ? "ol" : "ul";
    return "<" + tag + ">" + items.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("") + "</" + tag + ">";
  }

  function renderGrid() {
    if (!grid) return;
    grid.innerHTML = situations.map(function (s) {
      return (
        '<button type="button" class="sit-card" data-id="' + escapeHtml(s.id) + '">' +
          '<span class="icon" aria-hidden="true">' + s.icon + "</span>" +
          '<span class="label">' + escapeHtml(s.label) + "</span>" +
          '<span class="hint">' + escapeHtml(s.hint) + "</span>" +
        "</button>"
      );
    }).join("");

    grid.querySelectorAll(".sit-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openCard(btn.getAttribute("data-id"));
      });
    });
    syncFavMarks();
  }

  function syncFavMarks() {
    if (!grid) return;
    var favs = getFavourites();
    grid.querySelectorAll(".sit-card").forEach(function (btn) {
      var id = btn.getAttribute("data-id");
      btn.classList.toggle("fav-marked", favs.indexOf(id) !== -1);
      btn.classList.toggle("active", id === activeId);
    });
  }

  function renderCard(id) {
    var s = byId[id];
    if (!s || !panel) return;
    var saved = isFav(id);
    panel.hidden = false;
    panel.innerHTML =
      '<div class="protocol-head">' +
        "<h3>" + escapeHtml(s.icon + " " + s.title) + "</h3>" +
        '<button type="button" class="btn-fav' + (saved ? " saved" : "") + '" id="fav-toggle">' +
          (saved ? "★ Saved" : "☆ Save") +
        "</button>" +
      "</div>" +
      '<div class="block"><h4>What\'s going on</h4><p>' + escapeHtml(s.whatsGoingOn) + "</p></div>" +
      '<div class="block"><h4>Try this</h4>' + listHtml(s.tryThis, true) + "</div>" +
      '<div class="block"><h4>Why it helps</h4><p>' + escapeHtml(s.whyItHelps) + "</p></div>" +
      '<div class="block ethics"><h4>Ethics note</h4><p>' + escapeHtml(s.ethicsNote) + "</p></div>" +
      '<div class="block outside"><h4>When to get outside help</h4><p>' + escapeHtml(s.outsideHelp) + "</p></div>";

    var toggle = document.getElementById("fav-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () { toggleFav(id); });
    }
  }

  function openCard(id) {
    if (!byId[id]) return;
    activeId = id;
    renderCard(id);
    syncFavMarks();
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderFavourites() {
    if (!favList) return;
    var favs = getFavourites();
    favList.querySelectorAll(".fav-item").forEach(function (n) { n.remove(); });
    if (favEmpty) favEmpty.style.display = favs.length ? "none" : "";

    favs.forEach(function (id) {
      var s = byId[id];
      if (!s) return;
      var row = document.createElement("div");
      row.className = "fav-item";
      var openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.textContent = s.icon + " " + s.label;
      openBtn.addEventListener("click", function () {
        openCard(id);
        var sit = document.getElementById("situations");
        if (sit) sit.scrollIntoView({ behavior: "smooth" });
      });
      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", function () { toggleFav(id); });
      row.appendChild(openBtn);
      row.appendChild(removeBtn);
      favList.appendChild(row);
    });
  }

  renderGrid();
  renderFavourites();

  // Deep-link support: #bedtime etc.
  var hash = (location.hash || "").replace(/^#/, "");
  if (byId[hash]) openCard(hash);
})();
