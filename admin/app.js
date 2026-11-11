(function () {
  var login = document.getElementById("login");
  var app = document.getElementById("app");
  var view = document.getElementById("view");
  var notice = document.getElementById("notice");
  var state = { view: "overview", site: null, mail: null, quotes: [], filter: "all", query: "", sectionQuery: "", selected: null, mustChange: false, contentTab: "Navigation" };

  var titles = {
    overview: ["Dashboard", "Overview"],
    quotes: ["Inbox", "Quote requests"],
    sections: ["Website", "Page sections"],
    content: ["Website", "Page content"],
    details: ["Website", "Contact and statistics"],
    account: ["Settings", "Account"]
  };

  var blocks = [
    ["header", "Header", "Logo, menu, quote button and language.", [
      ["header.logo", "Logo"],
      ["nav.home", "Home"],
      ["nav.about", "About"],
      ["nav.services", "Services"],
      ["nav.contact", "Contact"],
      ["header.quote", "Get a quote"],
      ["header.lang", "Language switch"]
    ]],
    ["hero", "Hero", "Opening banner, headline and calls to action.", [
      ["hero.photo", "Photograph"],
      ["hero.kicker", "Eyebrow"],
      ["hero.title", "Headline"],
      ["hero.lede", "Introduction"],
      ["hero.quote", "Get a quote"],
      ["hero.services", "Our services"],
      ["hero.f1", "Feature 1"],
      ["hero.f2", "Feature 2"],
      ["hero.f3", "Feature 3"]
    ]],
    ["heroCards", "Service preview", "The three cards under the hero.", [
      ["heroCards.sea", "Sea freight"],
      ["heroCards.air", "Air freight"],
      ["heroCards.land", "Land transport"]
    ]],
    ["stats", "Statistics", "The four figures under the hero.", [
      ["stat.1", "Successful shipments"],
      ["stat.2", "Trusted clients"],
      ["stat.3", "Global destinations"],
      ["stat.4", "Years of experience"]
    ]],
    ["about", "About", "Photo, introduction, points and button.", [
      ["about.photo", "Photograph"],
      ["about.kicker", "Eyebrow"],
      ["about.title", "Title"],
      ["about.body", "Paragraph"],
      ["about.p1", "Point 1"],
      ["about.p2", "Point 2"],
      ["about.p3", "Point 3"],
      ["about.p4", "Point 4"],
      ["about.more", "Button"]
    ]],
    ["services", "Services", "Section heading and the three service cards.", [
      ["services.head", "Heading"],
      ["services.sea", "Sea freight"],
      ["services.seaMore", "Sea learn more"],
      ["services.air", "Air freight"],
      ["services.airMore", "Air learn more"],
      ["services.land", "Land transport"],
      ["services.landMore", "Land learn more"]
    ]],
    ["process", "How it works", "Heading and the four steps.", [
      ["process.head", "Heading"],
      ["step.1", "Step 1"],
      ["step.2", "Step 2"],
      ["step.3", "Step 3"],
      ["step.4", "Step 4"]
    ]],
    ["contact", "Contact", "Details, map and quick actions.", [
      ["contact.kicker", "Eyebrow"],
      ["contact.title", "Title"],
      ["contact.lede", "Introduction"],
      ["contact.manager", "Manager"],
      ["contact.phone", "Office phone"],
      ["contact.mobile", "Mobile"],
      ["contact.email", "Email"],
      ["contact.address", "Address"],
      ["contact.map", "Map"],
      ["contact.quick", "Quick contact title"],
      ["contact.emailBtn", "Email button"],
      ["contact.call", "Call button"]
    ]],
    ["footer", "Footer", "Logo, links and copyright.", [
      ["footer.logo", "Logo"],
      ["footer.home", "Home"],
      ["footer.about", "About"],
      ["footer.services", "Services"],
      ["footer.contact", "Contact"],
      ["footer.copy", "Copyright"]
    ]],
    ["whatsapp", "WhatsApp button", "The floating WhatsApp button.", []],
    ["quote", "Quote form", "The popup and every field inside it. Name, email, phone, service and details are required for a request to send.", [
      ["quote.kicker", "Eyebrow"],
      ["quote.title", "Title"],
      ["quote.text", "Introduction"],
      ["quote.name", "Full name"],
      ["quote.company", "Company"],
      ["quote.email", "Email"],
      ["quote.phone", "Phone"],
      ["quote.service", "Service menu"],
      ["quote.sea", "Sea option"],
      ["quote.air", "Air option"],
      ["quote.land", "Land option"],
      ["quote.message", "Shipment details"],
      ["quote.submit", "Submit button"],
      ["quote.success", "Success title"],
      ["quote.successText", "Success message"],
      ["quote.close", "Close button"]
    ]]
  ];

  var groups = [
    ["Navigation", ["nav.home", "Home", "nav.about", "About", "nav.services", "Services", "nav.contact", "Contact", "nav.quote", "Get a quote"]],
    ["Hero", ["hero.kicker", "Eyebrow", "hero.titleA", "Headline line 1", "hero.titleB", "Headline line 2", "hero.lede", "Introduction", "hero.services", "Secondary button", "hero.f1", "Feature 1", "hero.f2", "Feature 2", "hero.f3", "Feature 3"]],
    ["Services", ["svc.sea.name", "Sea name", "svc.sea.short", "Sea short text", "svc.sea.long", "Sea description", "svc.air.name", "Air name", "svc.air.short", "Air short text", "svc.air.long", "Air description", "svc.land.name", "Land name", "svc.land.short", "Land short text", "svc.land.long", "Land description", "services.kicker", "Section eyebrow", "services.title", "Section title", "services.lede", "Section introduction", "services.more", "Learn more"]],
    ["About", ["about.kicker", "Eyebrow", "about.t1", "Title line 1", "about.t2", "Title line 2", "about.t3", "Highlighted word", "about.body", "Paragraph", "about.p1", "Point 1", "about.p2", "Point 2", "about.p3", "Point 3", "about.p4", "Point 4", "about.more", "Button"]],
    ["Process", ["process.kicker", "Eyebrow", "process.title", "Title", "step.1.t", "Step 1 title", "step.1.d", "Step 1 text", "step.2.t", "Step 2 title", "step.2.d", "Step 2 text", "step.3.t", "Step 3 title", "step.3.d", "Step 3 text", "step.4.t", "Step 4 title", "step.4.d", "Step 4 text"]],
    ["Contact and quote", ["contact.kicker", "Eyebrow", "contact.title", "Title", "contact.lede", "Introduction", "contact.role", "Role", "contact.address", "Address", "contact.quick", "Quick contact title", "contact.email", "Email button", "contact.call", "Call button", "contact.map", "Map link", "quote.title", "Quote title", "quote.text", "Quote introduction", "quote.name", "Name label", "quote.company", "Company label", "quote.email", "Email label", "quote.phone", "Phone label", "quote.service", "Service label", "quote.choose", "Service placeholder", "quote.message", "Message label", "quote.submit", "Submit button", "quote.success", "Success title", "quote.successText", "Success message", "quote.close", "Close button", "quote.sending", "Sending label", "quote.err", "Form error", "quote.errNetwork", "Network error"]],
    ["Other", ["brand.tag", "Logo tagline", "stat.1", "Stat 1 label", "stat.2", "Stat 2 label", "stat.3", "Stat 3 label", "stat.4", "Stat 4 label", "footer.rights", "Footer rights", "meta.title", "Browser title", "meta.description", "Meta description"]]
  ];

  var serviceNames = { sea: "Sea Freight", air: "Air Freight", land: "Land Transport" };

  function api(url, options) {
    return fetch(url, Object.assign({ headers: { "Content-Type": "application/json" } }, options || {}))
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok) {
            var error = new Error(data.error || "request failed");
            error.status = response.status;
            if (response.status === 401 && url.indexOf("/api/login") === -1) {
              login.hidden = false;
              app.hidden = true;
            }
            throw error;
          }
          return data;
        });
      });
  }

  function normalizeSite(site) {
    site = site || {};
    if (!site.sections || typeof site.sections !== "object") site.sections = {};
    if (!site.rows || typeof site.rows !== "object") site.rows = {};
    if (!Array.isArray(site.stats) || site.stats.length !== 4) site.stats = ["500+", "100+", "50+", "10+"];
    if (!site.contact || typeof site.contact !== "object") site.contact = {};
    if (!site.copy || typeof site.copy !== "object") site.copy = { en: {}, ar: {} };
    if (!site.copy.en || typeof site.copy.en !== "object") site.copy.en = {};
    if (!site.copy.ar || typeof site.copy.ar !== "object") site.copy.ar = {};
    return site;
  }

  function saveMessage(error, fallback) {
    if (error && error.status === 401) return "Sign in again, then save.";
    if (error && error.message === "invalid site") return "Check the email address and try again.";
    return fallback;
  }

  function toast(message, isError) {
    notice.hidden = false;
    notice.textContent = message;
    notice.classList.toggle("is-error", !!isError);
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { notice.hidden = true; }, 2800);
  }

  function setView(name) {
    state.view = name;
    document.querySelectorAll(".side-nav button").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-view") === name);
    });
    document.getElementById("eyebrow").textContent = titles[name][0];
    document.getElementById("view-title").textContent = titles[name][1];
    render();
  }

  function updateCount() {
    var count = state.quotes.filter(function (quote) { return quote.status === "new"; }).length;
    var badge = document.getElementById("new-count");
    badge.hidden = count === 0;
    badge.textContent = String(count);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/\n/g, "&#10;");
  }

  function inputValue(label, value, name, long, hint) {
    var note = hint ? '<small class="hint">' + hint + "</small>" : "";
    if (long) {
      return '<label class="field">' + label + note + '<textarea name="' + name + '" rows="4">' + escapeHtml(value || "") + "</textarea></label>";
    }
    return '<label class="field">' + label + note + '<input name="' + name + '" value="' + escapeAttr(value || "") + '"></label>';
  }

  function visibilityCounts() {
    var rows = (state.site && state.site.rows) || {};
    var sectionsOn = blocks.filter(function (block) { return state.site.sections[block[0]] !== false; }).length;
    var rowTotal = 0;
    var rowOn = 0;
    blocks.forEach(function (block) {
      block[3].forEach(function (row) {
        rowTotal += 1;
        if (rows[row[0]] !== false) rowOn += 1;
      });
    });
    return { sectionsOn: sectionsOn, sections: blocks.length, rowOn: rowOn, rowTotal: rowTotal };
  }

  function counts() {
    return {
      all: state.quotes.length,
      "new": state.quotes.filter(function (quote) { return quote.status === "new"; }).length,
      reviewed: state.quotes.filter(function (quote) { return quote.status === "reviewed"; }).length,
      closed: state.quotes.filter(function (quote) { return quote.status === "closed"; }).length
    };
  }

  function renderOverview() {
    var tally = counts();
    var shown = visibilityCounts();
    var latest = state.quotes.slice(0, 4);
    var list = latest.map(function (quote) {
      return '<button type="button" class="quote" data-open-quote="' + quote.id + '">' +
        "<strong>" + escapeHtml(quote.name) + "</strong>" +
        "<span>" + escapeHtml(serviceNames[quote.service] || quote.service) + " · " + new Date(quote.createdAt).toLocaleString() + "</span>" +
        '<em class="badge ' + quote.status + '">' + quote.status + "</em></button>";
    }).join("") || '<div class="empty">No quote requests yet. New requests from the website appear here.</div>';

    view.innerHTML =
      '<div class="metrics">' +
      metric(tally["new"], "New quotes", "quotes") +
      metric(tally.all, "All quotes", "quotes") +
      metric(shown.sectionsOn + " / " + shown.sections, "Sections visible", "sections") +
      metric(shown.rowOn + " / " + shown.rowTotal, "Rows visible", "sections") +
      "</div>" +
      '<div class="overview-grid">' +
      '<section class="panel"><div class="panel-head"><h3>Latest requests</h3><button type="button" class="ghost" data-jump="quotes">Open inbox</button></div>' + list + "</section>" +
      '<section class="panel"><div class="panel-head"><h3>Quick actions</h3></div>' +
      '<div class="action-list">' +
      action("sections", "Show or hide any row", "Turn a whole section off, or hide a single line inside it.") +
      action("content", "Edit English and Arabic", "Update headlines, services and the quote form.") +
      action("details", "Update contact and figures", "Phone, email, address, map and the four statistics.") +
      action("account", "Password and email delivery", "Protect the dashboard and route quotes to the office inbox.") +
      "</div></section></div>";
  }

  function metric(value, label, viewName) {
    return '<button type="button" class="metric" data-jump="' + viewName + '"><strong>' + escapeHtml(value) + "</strong><span>" + label + "</span></button>";
  }

  function action(viewName, title, text) {
    return '<button type="button" class="action" data-jump="' + viewName + '"><strong>' + title + "</strong><span>" + text + "</span></button>";
  }

  function renderQuotes() {
    var tally = counts();
    var needle = state.query.trim().toLowerCase();
    var filtered = state.quotes.filter(function (quote) {
      var statusOk = state.filter === "all" || quote.status === state.filter;
      var haystack = [quote.name, quote.company, quote.email, quote.phone, quote.message, serviceNames[quote.service]].join(" ").toLowerCase();
      return statusOk && (!needle || haystack.indexOf(needle) !== -1);
    });
    var list = filtered.map(function (quote) {
      return '<button type="button" class="quote' + (state.selected === quote.id ? " is-selected" : "") + '" data-id="' + quote.id + '">' +
        '<strong>' + escapeHtml(quote.name) + "</strong>" +
        '<span>' + escapeHtml(quote.company || "No company") + " · " + escapeHtml(serviceNames[quote.service] || quote.service) + "</span>" +
        "<span>" + new Date(quote.createdAt).toLocaleString() + "</span>" +
        '<em class="badge ' + quote.status + '">' + quote.status + "</em>" +
        '<em class="badge ' + (quote.emailed ? "mailed" : "mail-pending") + '">' + (quote.emailed ? "emailed" : "inbox only") + "</em>" +
        "</button>";
    }).join("") || '<div class="empty">No quote requests match this view.</div>';

    var selected = state.quotes.filter(function (quote) { return quote.id === state.selected; })[0];
    var detail = '<div class="empty">Select a request to read it.</div>';
    if (selected) {
      var mailNote = selected.emailed
        ? "Sent to info@transitchains.com and shadi.shaqour@transitchains.com" + (selected.emailedAt ? " · " + new Date(selected.emailedAt).toLocaleString() : "")
        : (selected.emailError ? selected.emailError : "Saved in the dashboard. Configure SMTP under Account to deliver office email.");
      detail = '<article class="detail">' +
        "<h3>" + escapeHtml(selected.name) + "</h3>" +
        '<p class="muted">' + new Date(selected.createdAt).toLocaleString() + "</p>" +
        "<p><strong>Company</strong><br>" + escapeHtml(selected.company || "—") + "</p>" +
        "<p><strong>Email</strong><br><a href=\"mailto:" + escapeAttr(selected.email) + "\">" + escapeHtml(selected.email) + "</a></p>" +
        "<p><strong>Phone</strong><br><a href=\"tel:" + escapeAttr(selected.phone) + "\">" + escapeHtml(selected.phone) + "</a></p>" +
        "<p><strong>Service</strong><br>" + escapeHtml(serviceNames[selected.service] || selected.service) + "</p>" +
        "<p><strong>Details</strong><br>" + escapeHtml(selected.message) + "</p>" +
        "<p><strong>Office email</strong><br>" + escapeHtml(mailNote) + "</p>" +
        '<div class="detail-actions">' +
        '<button type="button" class="ghost" data-status="reviewed">Mark reviewed</button>' +
        '<button type="button" class="ghost" data-status="closed">Close</button>' +
        '<button type="button" class="ghost" data-status="new">Mark new</button>' +
        '<button type="button" class="ghost" data-resend="1">Send to office email</button>' +
        '<a class="ghost" href="mailto:' + escapeAttr(selected.email) + "?subject=" + encodeURIComponent("Your TransitChains quote") + '">Reply by email</a>' +
        '<button type="button" class="danger" data-delete="1">Delete</button>' +
        "</div></article>";
    }

    view.innerHTML =
      '<div class="toolbar">' +
      [["all", "All"], ["new", "New"], ["reviewed", "Reviewed"], ["closed", "Closed"]].map(function (item) {
        return '<button type="button" class="ghost' + (state.filter === item[0] ? " is-on" : "") + '" data-filter="' + item[0] + '">' + item[1] + " <b>" + tally[item[0]] + "</b></button>";
      }).join("") +
      '<label class="search">Search<input type="search" id="quote-search" value="' + escapeAttr(state.query) + '" placeholder="Name, company, email or phone"></label>' +
      "</div>" +
      '<div class="layout"><div class="quote-list">' + list + "</div><div>" + detail + "</div></div>";
  }

  function renderSections() {
    var shown = visibilityCounts();
    var needle = state.sectionQuery.trim().toLowerCase();
    var html = blocks.map(function (block) {
      var sectionHit = !needle || block[1].toLowerCase().indexOf(needle) !== -1 || block[2].toLowerCase().indexOf(needle) !== -1;
      var rows = block[3].filter(function (row) {
        return sectionHit || row[1].toLowerCase().indexOf(needle) !== -1;
      });
      if (!sectionHit && !rows.length) return "";
      var on = state.site.sections[block[0]] !== false;
      var rowHtml = rows.map(function (row) {
        var rowOn = state.site.rows[row[0]] !== false;
        return '<label class="switch-row is-row"><span><strong>' + row[1] + "</strong></span>" +
          '<span class="switch-meta">' + (rowOn ? "Visible" : "Hidden") + "</span>" +
          '<span class="switch"><input type="checkbox" data-row="' + row[0] + '"' + (rowOn ? " checked" : "") + "><i></i></span></label>";
      }).join("");
      var rowCount = block[3].length;
      return '<section class="vis-group">' +
        '<label class="switch-row is-section"><span><strong>' + block[1] + "</strong><p>" + block[2] + (rowCount ? " · " + rowCount + " rows inside" : "") + "</p></span>" +
        '<span class="switch-meta">' + (on ? "Visible" : "Hidden") + "</span>" +
        '<span class="switch"><input type="checkbox" data-section="' + block[0] + '"' + (on ? " checked" : "") + "><i></i></span></label>" +
        (rowHtml ? '<div class="row-list">' + rowHtml + "</div>" : "") +
        "</section>";
    }).join("");
    view.innerHTML = '<p class="lead" id="visibility-lead">' + shown.sectionsOn + " of " + shown.sections + " sections are visible, and " +
      shown.rowOn + " of " + shown.rowTotal + " rows. A hidden section removes that whole block. A hidden row removes that line only. Changes save immediately.</p>" +
      '<label class="search">Find a row<input type="search" id="section-search" value="' + escapeAttr(state.sectionQuery) + '" placeholder="Hero, phone, map, step…"></label>' +
      '<div class="section-list">' + (html || '<div class="empty">No rows match that search.</div>') + "</div>";
  }

  function renderContent() {
    var copy = state.site.copy;
    var group = groups.filter(function (item) { return item[0] === state.contentTab; })[0] || groups[0];
    state.contentTab = group[0];
    var fields = "";
    for (var i = 0; i < group[1].length; i += 2) {
      var key = group[1][i];
      var label = group[1][i + 1];
      var long = /lede|body|address|message|description|successText|long/.test(key) || (copy.en[key] || "").length > 90;
      fields += '<div class="pair">' +
        inputValue("English · " + label, copy.en[key], "en." + key, long) +
        inputValue("Arabic · " + label, copy.ar[key], "ar." + key, long) +
        "</div>";
    }
    view.innerHTML = '<form id="content-form">' +
      '<div class="tabs">' + groups.map(function (item) {
        return '<button type="button" class="ghost' + (item[0] === group[0] ? " is-on" : "") + '" data-tab="' + escapeAttr(item[0]) + '">' + item[0] + "</button>";
      }).join("") + "</div>" +
      '<section class="content-block"><h3>' + group[0] + "</h3>" + fields + "</section>" +
      '<div class="save-row"><button class="primary" type="submit">Save ' + group[0].toLowerCase() + "</button></div></form>";
  }

  function renderDetails() {
    var contact = state.site.contact;
    var stats = state.site.stats;
    var statLabels = ["Successful shipments", "Trusted clients", "Global destinations", "Years of experience"];
    view.innerHTML = '<form id="details-form"><div class="content-grid">' +
      '<section class="content-block"><h3>People and email</h3><div class="pair">' +
      inputValue("General manager", contact.manager, "manager") +
      inputValue("Email address", contact.email, "email", false, "Shown on the site and used for the mailto link.") +
      "</div></section>" +
      '<section class="content-block"><h3>Phone numbers</h3><div class="pair">' +
      inputValue("Office phone", contact.phone, "phone", false, "The number visitors read.") +
      inputValue("Office dial link", contact.phoneTel, "phoneTel", false, "Digits used when someone taps the number, for example +96265668960.") +
      inputValue("Mobile", contact.mobile, "mobile") +
      inputValue("Mobile dial link", contact.mobileTel, "mobileTel") +
      inputValue("WhatsApp number", contact.whatsapp, "whatsapp", false, "Country code and number, without spaces or a plus sign.") +
      "</div></section>" +
      '<section class="content-block"><h3>Map</h3>' +
      inputValue("Map search", contact.mapQuery, "mapQuery", true, "The words Google Maps uses to find the office.") +
      "</section>" +
      '<section class="content-block"><h3>Statistics</h3><p class="hint">These are the four figures in the highlight row. Their labels are edited under Content, in Other.</p><div class="stats-grid">' +
      stats.map(function (value, index) {
        return inputValue(statLabels[index], value, "stat" + index);
      }).join("") +
      "</div></section></div>" +
      '<div class="save-row"><button class="primary" type="submit">Save contact and statistics</button></div></form>';
  }

  function renderAccount() {
    var mail = state.mail || {};
    view.innerHTML = '<div class="content-grid">' +
      '<form id="password-form" class="content-block narrow">' +
      "<h3>Change password</h3>" +
      (state.mustChange ? '<p class="form-error">The default password is still active. Choose a new one before using the dashboard.</p>' : '<p class="hint">Use at least 8 characters. This password is only for the dashboard.</p>') +
      inputValue("Current password", "", "current") +
      inputValue("New password", "", "password") +
      inputValue("Confirm new password", "", "confirm") +
      '<div class="save-row"><button class="primary" type="submit">Update password</button></div></form>' +
      '<form id="mail-form" class="content-block">' +
      "<h3>Quote email delivery</h3>" +
      '<p class="hint">Every website quote is saved in Quotes and emailed to <strong>info@transitchains.com</strong> and <strong>shadi.shaqour@transitchains.com</strong>. Enter the office SMTP details from the hosting provider or Microsoft 365.</p>' +
      '<label class="switch-row is-section"><span><strong>Send quote emails</strong><p>Turn delivery on once SMTP is ready.</p></span>' +
      '<span class="switch-meta">' + (mail.enabled ? "On" : "Off") + '</span>' +
      '<span class="switch"><input type="checkbox" name="enabled"' + (mail.enabled ? " checked" : "") + "><i></i></span></label>" +
      '<div class="pair" style="margin-top:14px">' +
      inputValue("SMTP host", mail.host, "host", false, "Example: mail.transitchains.com or smtp.office365.com") +
      inputValue("Port", String(mail.port || 587), "port", false, "Usually 587 with TLS, or 465 with SSL.") +
      inputValue("Username", mail.username, "username") +
      inputValue("Password", "", "password", false, mail.hasPassword ? "Leave blank to keep the saved password." : "SMTP password or app password.") +
      inputValue("From email", mail.fromEmail, "fromEmail") +
      inputValue("From name", mail.fromName, "fromName") +
      "</div>" +
      '<div class="pair">' +
      '<label class="field"><input type="checkbox" name="useTls"' + (mail.useTls ? " checked" : "") + "> Use STARTTLS</label>" +
      '<label class="field"><input type="checkbox" name="useSsl"' + (mail.useSsl ? " checked" : "") + "> Use SSL</label>" +
      "</div>" +
      '<p class="hint">Recipients are fixed: info@transitchains.com and shadi.shaqour@transitchains.com. Reply-To is the visitor email.</p>' +
      '<div class="save-row"><button class="primary" type="submit">Save mail settings</button>' +
      '<button class="ghost" type="button" id="mail-test">Send test email</button></div></form>' +
      '<section class="content-block"><h3>Where this dashboard lives</h3>' +
      "<p>Sign in at <strong>/admin</strong> while the site server is running. For the live server, start with <code>./start.sh</code> or <code>HOST=0.0.0.0 python3 server.py</code>.</p>" +
      '<p><a class="ghost" href="/" target="_blank" rel="noopener">Open the website</a></p></section></div>';
    view.querySelectorAll("#password-form input").forEach(function (input) { input.type = "password"; input.required = true; input.autocomplete = "new-password"; });
    view.querySelector('#password-form [name="current"]').autocomplete = "current-password";
    var mailPassword = view.querySelector('#mail-form [name="password"]');
    if (mailPassword) {
      mailPassword.type = "password";
      mailPassword.autocomplete = "new-password";
    }
  }

  function render() {
    if (!state.site && state.view !== "quotes") return;
    if (state.view === "overview") renderOverview();
    if (state.view === "quotes") renderQuotes();
    if (state.view === "sections") renderSections();
    if (state.view === "content") renderContent();
    if (state.view === "details") renderDetails();
    if (state.view === "account") renderAccount();
  }

  function collectCopy(form) {
    var copy = { en: Object.assign({}, state.site.copy.en), ar: Object.assign({}, state.site.copy.ar) };
    new FormData(form).forEach(function (value, key) {
      var lang = key.slice(0, 2);
      copy[lang][key.slice(3)] = value;
    });
    return copy;
  }

  document.getElementById("login-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var error = document.getElementById("login-error");
    error.hidden = true;
    api("/api/login", {
      method: "POST",
      body: JSON.stringify({ password: new FormData(event.target).get("password") })
    }).then(function (data) {
      state.mustChange = !!data.mustChange;
      return boot();
    }).catch(function () {
      error.hidden = false;
    });
  });

  document.getElementById("logout").addEventListener("click", function () {
    api("/api/logout", { method: "POST", body: "{}" }).finally(function () {
      app.hidden = true;
      login.hidden = false;
    });
  });

  document.querySelector(".side-nav").addEventListener("click", function (event) {
    var button = event.target.closest("[data-view]");
    if (button) setView(button.getAttribute("data-view"));
  });

  function stashContent() {
    var form = document.getElementById("content-form");
    if (form && state.site) state.site.copy = collectCopy(form);
  }

  view.addEventListener("click", function (event) {
    var jump = event.target.closest("[data-jump]");
    if (jump) {
      setView(jump.getAttribute("data-jump"));
      return;
    }
    var tab = event.target.closest("[data-tab]");
    if (tab) {
      stashContent();
      state.contentTab = tab.getAttribute("data-tab");
      renderContent();
      return;
    }
    var opened = event.target.closest("[data-open-quote]");
    if (opened) {
      state.selected = opened.getAttribute("data-open-quote");
      state.filter = "all";
      setView("quotes");
      return;
    }
    var filter = event.target.closest("[data-filter]");
    if (filter) {
      state.filter = filter.getAttribute("data-filter");
      renderQuotes();
      return;
    }
    var quote = event.target.closest("[data-id]");
    if (quote && !event.target.closest("[data-status], [data-delete], [data-resend], a")) {
      state.selected = quote.getAttribute("data-id");
      renderQuotes();
      return;
    }
    var status = event.target.closest("[data-status]");
    if (status && state.selected) {
      api("/api/admin/quotes/" + state.selected, {
        method: "PATCH",
        body: JSON.stringify({ status: status.getAttribute("data-status") })
      }).then(loadQuotes).then(function () { toast("Quote updated"); });
    }
    if (event.target.closest("[data-resend]") && state.selected) {
      api("/api/admin/quotes/" + state.selected + "/resend", { method: "POST", body: "{}" })
        .then(loadQuotes)
        .then(function () { toast("Quote emailed to the office"); })
        .catch(function (error) { toast(error.message || "Could not send the office email", true); });
    }
    if (event.target.closest("[data-delete]") && state.selected) {
      if (!window.confirm("Delete this quote request? This cannot be undone.")) return;
      api("/api/admin/quotes/" + state.selected, { method: "DELETE" }).then(function () {
        state.selected = null;
        return loadQuotes();
      }).then(function () { toast("Quote deleted"); });
    }
    if (event.target.id === "mail-test") {
      api("/api/admin/mail/test", { method: "POST", body: "{}" })
        .then(function () { toast("Test email sent to the office inboxes"); })
        .catch(function (error) { toast(error.message || "Could not send the test email", true); });
    }
  });

  view.addEventListener("input", function (event) {
    if (event.target.id === "quote-search" || event.target.id === "section-search") {
      var caret = event.target.selectionStart;
      if (event.target.id === "quote-search") {
        state.query = event.target.value;
        renderQuotes();
        var input = document.getElementById("quote-search");
        if (!input) return;
        input.focus();
        input.setSelectionRange(caret, caret);
      } else {
        state.sectionQuery = event.target.value;
        renderSections();
        var search = document.getElementById("section-search");
        if (!search) return;
        search.focus();
        search.setSelectionRange(caret, caret);
      }
    }
  });

  view.addEventListener("change", function (event) {
    var rowToggle = event.target.getAttribute && event.target.getAttribute("data-row") ? event.target : null;
    var sectionToggle = !rowToggle && event.target.getAttribute && event.target.getAttribute("data-section") ? event.target : null;
    var toggle = rowToggle || sectionToggle;
    if (!toggle) return;
    if (rowToggle) {
      if (!state.site.rows) state.site.rows = {};
      state.site.rows[rowToggle.getAttribute("data-row")] = rowToggle.checked;
    } else {
      state.site.sections[sectionToggle.getAttribute("data-section")] = sectionToggle.checked;
    }
    var meta = toggle.closest(".switch-row").querySelector(".switch-meta");
    if (meta) meta.textContent = toggle.checked ? "Visible" : "Hidden";
    var lead = document.getElementById("visibility-lead");
    if (lead) {
      var shown = visibilityCounts();
      lead.textContent = shown.sectionsOn + " of " + shown.sections + " sections are visible, and " +
        shown.rowOn + " of " + shown.rowTotal + " rows. A hidden section removes that whole block. A hidden row removes that line only. Changes save immediately.";
    }
    saveSite().then(function () { toast(rowToggle ? "Row updated" : "Section updated"); }).catch(function () {
      toggle.checked = !toggle.checked;
      if (rowToggle) state.site.rows[rowToggle.getAttribute("data-row")] = toggle.checked;
      else state.site.sections[sectionToggle.getAttribute("data-section")] = toggle.checked;
      if (meta) meta.textContent = toggle.checked ? "Visible" : "Hidden";
      toast("Could not save", true);
    });
  });

  view.addEventListener("submit", function (event) {
    if (event.target.id === "content-form") {
      event.preventDefault();
      state.site.copy = collectCopy(event.target);
      saveSite().then(function () { toast("Content saved"); }).catch(function (error) { toast(saveMessage(error, "Could not save content"), true); });
    }
    if (event.target.id === "details-form") {
      event.preventDefault();
      state.site = normalizeSite(state.site);
      var data = new FormData(event.target);
      ["manager", "email", "phone", "phoneTel", "mobile", "mobileTel", "whatsapp", "mapQuery"].forEach(function (key) {
        var value = data.get(key);
        state.site.contact[key] = value == null ? "" : String(value);
      });
      state.site.stats = [0, 1, 2, 3].map(function (index) {
        var value = data.get("stat" + index);
        return value == null || value === "" ? state.site.stats[index] || "0" : String(value);
      });
      if (!state.site.contact.email || state.site.contact.email.indexOf("@") === -1) {
        toast("Enter a valid email address before saving.", true);
        return;
      }
      saveSite().then(function () { toast("Details saved"); }).catch(function (error) { toast(saveMessage(error, "Could not save details"), true); });
    }
    if (event.target.id === "password-form") {
      event.preventDefault();
      var form = new FormData(event.target);
      if (form.get("password") !== form.get("confirm")) {
        toast("The new passwords do not match", true);
        return;
      }
      api("/api/admin/password", {
        method: "POST",
        body: JSON.stringify({ current: form.get("current"), password: form.get("password") })
      }).then(function () {
        state.mustChange = false;
        event.target.reset();
        toast("Password updated");
        renderAccount();
      }).catch(function (error) {
        toast(error.message === "short" ? "Use at least 8 characters" : "Current password is not correct", true);
      });
    }
    if (event.target.id === "mail-form") {
      event.preventDefault();
      var mailData = new FormData(event.target);
      var payload = {
        enabled: !!mailData.get("enabled"),
        host: mailData.get("host"),
        port: mailData.get("port"),
        username: mailData.get("username"),
        password: mailData.get("password"),
        fromEmail: mailData.get("fromEmail"),
        fromName: mailData.get("fromName"),
        useTls: !!mailData.get("useTls"),
        useSsl: !!mailData.get("useSsl")
      };
      api("/api/admin/mail", { method: "PUT", body: JSON.stringify(payload) })
        .then(function (data) {
          state.mail = data.mail || state.mail;
          toast("Mail settings saved");
          renderAccount();
        })
        .catch(function (error) { toast(saveMessage(error, "Could not save mail settings"), true); });
    }
  });

  function saveSite() {
    return api("/api/admin/site", { method: "PUT", body: JSON.stringify(state.site) });
  }

  function loadQuotes() {
    return api("/api/admin/quotes").then(function (data) {
      state.quotes = data.quotes || [];
      updateCount();
      if (state.view === "quotes") renderQuotes();
    });
  }

  function boot() {
    return Promise.all([api("/api/admin/session"), api("/api/admin/site"), api("/api/admin/quotes"), api("/api/admin/mail")])
      .then(function (results) {
        state.mustChange = !!results[0].mustChange;
        state.site = normalizeSite(results[1]);
        state.quotes = results[2].quotes || [];
        state.mail = results[3] || null;
        login.hidden = true;
        app.hidden = false;
        updateCount();
        setView(state.mustChange ? "account" : state.view);
      });
  }

  boot().catch(function () {
    login.hidden = false;
    app.hidden = true;
  });
})();
