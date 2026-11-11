(function () {
  var header = document.querySelector(".header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav a[href^='#']"));
  var sections = ["home", "about", "services", "contact"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var modal = document.getElementById("quote-modal");
  var form = document.getElementById("quote-form");
  var success = document.querySelector(".quote-success");
  var error = document.querySelector("[data-quote-error]");
  var lang = "en";
  var site = null;

  try { lang = localStorage.getItem("tc-lang") === "ar" ? "ar" : "en"; } catch (e) {}

  function copy() {
    return (site && site.copy && site.copy[lang]) || {};
  }

  function text(key, fallback) {
    var value = copy()[key];
    return typeof value === "string" && value ? value : fallback;
  }

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", text(open ? "menu.close" : "menu.open", open ? "Close menu" : "Open menu"));
  }

  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    var marker = window.scrollY + 140;
    var current = "home";
    sections.forEach(function (section) {
      if (section.hidden || section.offsetTop <= 0) return;
      if (section.offsetTop <= marker) current = section.id;
    });
    links.forEach(function (link) {
      if (link.hidden) return;
      var active = link.getAttribute("href") === "#" + current;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function apply() {
    var strings = copy();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-set-lang]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-set-lang") === lang);
    });
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var value = strings[el.getAttribute("data-i18n")];
      if (typeof value === "string") el.textContent = value;
    });
    var closer = document.querySelector(".modal-close");
    if (closer) closer.setAttribute("aria-label", text("quote.close", "Close"));
    if (strings["meta.title"]) document.title = strings["meta.title"];
    var description = document.querySelector('meta[name="description"]');
    if (description && strings["meta.description"]) description.setAttribute("content", strings["meta.description"]);

    var flags = (site && site.sections) || {};
    var rows = (site && site.rows) || {};
    document.querySelectorAll("[data-section]").forEach(function (el) {
      var key = el.getAttribute("data-section");
      var parts = (el.getAttribute("data-rows") || "").split(/\s+/).filter(Boolean);
      var empty = parts.length > 0 && parts.every(function (part) { return rows[part] === false; });
      el.hidden = flags[key] === false || empty;
    });
    document.querySelectorAll("[data-row]").forEach(function (el) {
      var key = el.getAttribute("data-row");
      el.hidden = rows[key] === false;
      if (el.tagName === "OPTION") el.disabled = el.hidden;
    });
    document.querySelectorAll("[data-nav]").forEach(function (el) {
      var section = el.getAttribute("data-nav");
      var row = el.getAttribute("data-row");
      el.hidden = flags[section] === false || (row && rows[row] === false);
    });
    document.querySelectorAll("[data-open-quote]").forEach(function (el) {
      var row = el.getAttribute("data-row");
      if (flags.quote === false || (row && rows[row] === false)) el.hidden = true;
    });
    document.body.classList.toggle("no-hero", flags.hero === false || document.querySelector("[data-section='hero']").hidden);
    header.classList.toggle("is-solid", flags.hero === false || document.querySelector("[data-section='hero']").hidden);

    var stats = (site && site.stats) || [];
    document.querySelectorAll("[data-stat]").forEach(function (el) {
      var value = stats[Number(el.getAttribute("data-stat"))];
      if (value) el.textContent = value;
    });

    var contact = (site && site.contact) || {};
    var manager = document.querySelector("[data-bind='manager']");
    if (manager && contact.manager) manager.textContent = contact.manager;
    bindLink("[data-bind='phone']", contact.phone, contact.phoneTel ? "tel:" + contact.phoneTel : "");
    bindLink("[data-bind='mobile']", contact.mobile, contact.mobileTel ? "tel:" + contact.mobileTel : "");
    bindLink("[data-bind='email']", contact.email, contact.email ? "mailto:" + contact.email : "");
    var call = document.querySelector("[data-bind='call']");
    if (call && contact.phoneTel) call.href = "tel:" + contact.phoneTel;
    var whatsapp = document.querySelector("[data-bind='whatsapp']");
    if (whatsapp && contact.whatsapp) whatsapp.href = "https://wa.me/" + contact.whatsapp.replace(/\D/g, "");
    if (contact.mapQuery) {
      var mapUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(contact.mapQuery);
      var embed = "https://maps.google.com/maps?q=" + encodeURIComponent(contact.mapQuery) + "&z=15&output=embed";
      ["[data-bind='address']", "[data-bind='mapLink']"].forEach(function (selector) {
        var link = document.querySelector(selector);
        if (link) link.href = mapUrl;
      });
      var frame = document.querySelector("[data-bind='map']");
      if (frame && frame.getAttribute("src") !== embed) frame.setAttribute("src", embed);
    }
    setMenu(nav.classList.contains("is-open"));
    onScroll();
  }

  function bindLink(selector, label, href) {
    var el = document.querySelector(selector);
    if (!el) return;
    if (label) el.textContent = label;
    if (href) el.href = href;
  }

  function openQuote(service) {
    if (site && site.sections && site.sections.quote === false) return;
    form.hidden = false;
    success.hidden = true;
    error.hidden = true;
    form.reset();
    document.querySelectorAll("#quote-form option[data-row]").forEach(function (option) {
      option.disabled = option.hidden;
    });
    var option = service && form.querySelector('option[value="' + service + '"]');
    if (option && !option.hidden) form.elements.service.value = service;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    var field = Array.prototype.filter.call(form.querySelectorAll("input, select, textarea"), function (el) {
      return el.type !== "hidden" && !el.classList.contains("hp") && !el.closest("[hidden]");
    })[0];
    if (field) field.focus();
  }

  function closeQuote() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  toggle.addEventListener("click", function () {
    setMenu(!nav.classList.contains("is-open"));
  });

  links.forEach(function (link) {
    link.addEventListener("click", function () { setMenu(false); });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      setMenu(false);
      closeQuote();
    }
  });

  document.querySelectorAll("[data-set-lang]").forEach(function (button) {
    button.addEventListener("click", function () {
      lang = button.getAttribute("data-set-lang") === "ar" ? "ar" : "en";
      try { localStorage.setItem("tc-lang", lang); } catch (e) {}
      apply();
    });
  });

  document.addEventListener("click", function (event) {
    var opener = event.target.closest("[data-open-quote]");
    if (opener) {
      event.preventDefault();
      setMenu(false);
      openQuote(opener.getAttribute("data-service") || "");
      return;
    }
    if (event.target.closest("[data-close-quote]")) closeQuote();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    error.hidden = true;
    var submit = form.querySelector("button[type='submit'] span");
    var data = {
      name: form.elements.name.value.trim(),
      company: form.elements.company.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim(),
      service: form.elements.service.value,
      message: form.elements.message.value.trim(),
      website: form.elements.website.value
    };
    if (submit) submit.textContent = text("quote.sending", "Sending…");
    fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (response) {
      if (!response.ok) throw new Error("invalid");
      form.hidden = true;
      success.hidden = false;
    }).catch(function () {
      error.hidden = false;
      error.textContent = text("quote.errNetwork", "The request could not be sent. Please try again.");
    }).finally(function () {
      if (submit) submit.textContent = text("quote.submit", "Send request");
    });
  });

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  apply();

  fetch("/api/site").then(function (response) {
    if (!response.ok) throw new Error("site");
    return response.json();
  }).then(function (data) {
    site = data;
    apply();
  }).catch(function () {});
})();
