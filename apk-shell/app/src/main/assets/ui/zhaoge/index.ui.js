"use strict";
/* 朝歌 · UI 薄壳：Compose DSL 壳 + WebView 加载本地 HTML，数据走 JS 桥 */
var HOST_INTERFACE = "ZhaoGeHost";
var VIRTUAL_URL = "https://zhaoge.internal/home?v=" + Date.now();
var HTML_PATH = "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/resources/zhaoge.html";
var HTML_FALLBACK_PATH = "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/resources/zhaoge.html";
var AVATAR_PATHS = {
  chaozhao: "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/resources/avatar_chaozhao.jpg",
  jinji: "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/resources/avatar_jinji.jpg",
};
var zhaoge_ipc = require("../../shared/zhaoge_ipc.js");
var RELAY_BASE = "http://127.0.0.1:3011";
var RELAY_KEY = "jinji2026";
var RELAY_TMP = "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/ui/base/relaybox.json";
var RELAY_ACK = "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/ui/base/ack.json";
var RELAY_OUT = "/sdcard/Download/Operit/dev_package/zhaoge_outbox.json";
var RELAY_ENVF = "/sdcard/Download/Operit/dev_package/zhaoge_env.json";
var RELAY_USGF = "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/ui/bedroom/usage.json";
var RELAY_KEYIN = "/sdcard/Download/Operit/dev_package/zhaoge_keys_inbox.json";
function zgQ(url, k) {
  var m = new RegExp("[?&]" + k + "=([^&#]*)").exec(url);
  return m ? decodeURIComponent(m[1]) : "";
}
function zgJsonFile(p) { return buildFileResponse("application/json", p); }
function zgReadJson(p) {
  return Tools.Files.read(p).then(function (r) {
    var s = (r && r.content !== undefined) ? r.content : r;
    try { return JSON.parse(String(s || "{}")); } catch (e) { return {}; }
  }).catch(function () { return {}; });
}
function zgWriteJson(p, o) {
  return Tools.Files.write(p, JSON.stringify(o, null, 2), false, "android").catch(function () { });
}

function buildFileResponse(mime, path) {
  return {
    action: "respond",
    response: {
      mimeType: mime,
      encoding: "UTF-8",
      statusCode: 200,
      reasonPhrase: "OK",
      headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
      filePath: path,
    },
  };
}

function Screen(ctx) {
  var UI = ctx.UI;
  var ready = ctx.useState("zhaoge_home_ready", false);
  var bootStarted = ctx.useRef("zhaoge_home_boot_started", false);
  var controller = ctx.createWebViewController("zhaoge_home_webview");

  function registerBridge() {
    controller.removeJavascriptInterface(HOST_INTERFACE);
    controller.addJavascriptInterface(HOST_INTERFACE, {
      ping: async function () {
        return { success: true, message: "朝歌桥已就绪" };
      },
      takePill: async function () {
        try {
          var args = arguments;
          var raw = (args && args.length > 0) ? args[0] : null;
          var code = "";
          if (typeof raw === "string") code = raw;
          else if (Array.isArray(raw) && raw.length > 0) code = String(raw[0]);
          else if (raw && typeof raw === "object") code = String(raw.code || raw[0] || "");
          code = String(code).replace(/[^0-9A-Za-z]/g, "").slice(0, 8);
          if (!code) return { success: false, error: "没拿到药号" };
          var logPath = "/sdcard/Download/Operit/pills/last.json";
          var sent = "skip";
          try { await Tools.Files.write(logPath, JSON.stringify({ code: code, sent: "begin", at: Date.now() }), false, "android"); } catch (e) { }
          try {
            if (typeof Tools !== "undefined" && Tools.Chat && Tools.Chat.sendMessage) {
var chatId = null;
              try {
                var cr = await Tools.Files.read({ path: "/sdcard/Download/Operit/pills/chat.txt", environment: "android" });
                var rr = cr && (cr.content !== undefined ? cr.content : cr);
                if (rr) chatId = String(rr).trim().split("\n")[0];
              } catch (e2) { }
              var _p = Tools.Chat.sendMessage("药" + code, chatId || undefined, undefined, "朝歌", { persist_turn: false, notify_reply: true });
              if (_p && _p.then) { _p.then(function () { }, function () { }); }
              sent = "fired";
            } else if (typeof Tools === "undefined") {
              sent = "noTools";
            } else {
              sent = "noapi:" + Object.keys(Tools).join(",").slice(0, 120);
            }
          } catch (e) { sent = "fail:" + String((e && e.message) || e); }
          try {
            await Tools.Files.write(logPath, JSON.stringify({ code: code, sent: sent, at: Date.now() }), false, "android");
          } catch (e) { }
          return { success: true, code: code, sent: sent };
        } catch (e) {
          return { success: false, error: String((e && e.message) || e) };
        }
      },
      loadData: async function () {
        try {
          return await zhaoge_ipc.loadData();
        } catch (e) {
          return { success: false, error: String((e && e.message) || e) };
        }
      },
      saveData: async function () {
        try {
          var args = arguments;
          var raw = (args && args.length > 0) ? args[0] : null;
          var data = raw;
          if (typeof raw === "string") { try { data = JSON.parse(raw); } catch (e) { data = null; } }
          else if (Array.isArray(raw)) data = raw[0];
          if (!data || typeof data !== "object") {
            return { success: false, error: "saveData 参数无效" };
          }
          return await zhaoge_ipc.saveData(data);
        } catch (e) {
          return { success: false, error: "saveData 桥异常: " + String((e && e.message) || e) };
        }
      },
      relay: async function () {
        var H = { "Authorization": "Bearer " + RELAY_KEY, "Content-Type": "application/json" };
        try {
          var args = arguments;
          var raw = (args && args.length > 0) ? args[0] : null;
          var payload = null;
          if (typeof raw === "string") { try { payload = JSON.parse(raw); } catch (e) { payload = null; } }
          else if (Array.isArray(raw) && raw.length > 0) { try { payload = JSON.parse(String(raw[0])); } catch (e) { payload = null; } }
          else if (raw && typeof raw === "object") payload = raw;
          if (!payload) payload = {};
          var op = String(payload.op || "sync");
          var text = String(payload.text || "");
          var out = { ok: false, messages: [], sent: 0, err: "", at: Date.now() };
          if (op === "send" && text) {
            try {
              var sr = await Tools.Net.http({ url: RELAY_BASE + "/app/send", method: "POST", headers: H, body: JSON.stringify({ text: text }) });
              var sb = String((sr && (sr.content || sr.body)) || "");
              var so = null; try { so = JSON.parse(sb); } catch (e) { so = null; }
              if (so && so.id) out.sent = so.id;
            } catch (e) { out.err = String((e && e.message) || e); }
          }
          if (op === "setcfg" || op === "setfn") {
            try {
              var ENVF = "/sdcard/Download/Operit/dev_package/zhaoge_env.json";
              var USGF = "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/ui/bedroom/usage.json";
              var er = await Tools.Files.read(ENVF);
              var et = (er && er.content !== undefined) ? er.content : er;
              var env = {}; try { env = JSON.parse(String(et || "{}")); } catch (e) { env = {}; }
              env.bindings = env.bindings || {};
              var fnName = String(payload.fn || "CHAT");
              var cname = String(payload.name || payload.cfg || "");
              if (!cname) return { success: false, error: "no name" };
              if (op === "setcfg") { env.active = cname; env.bindings.CHAT = cname; }
              else { env.bindings[fnName] = cname; if (fnName === "CHAT") env.active = cname; }
              var d0 = new Date();
              env.updated = d0.getFullYear() + "-" + ("0" + (d0.getMonth() + 1)).slice(-2) + "-" + ("0" + d0.getDate()).slice(-2) + " " + ("0" + d0.getHours()).slice(-2) + ":" + ("0" + d0.getMinutes()).slice(-2) + ":" + ("0" + d0.getSeconds()).slice(-2);
              await Tools.Files.write(ENVF, JSON.stringify(env, null, 2), false, "android");
              try {
                var ur = await Tools.Files.read(USGF);
                var ut = (ur && ur.content !== undefined) ? ur.content : ur;
                var us = JSON.parse(String(ut || "{}"));
                us.active = env.active || us.active;
                var byn = {};
                (us.configs || []).forEach(function (c) { byn[c.name] = c; });
                (us.bindings || []).forEach(function (b) {
                  if (b.fn === "CHAT" && (op === "setcfg" || fnName === "CHAT")) b.cfg = env.bindings.CHAT;
                  if (op === "setfn" && b.fn === fnName) b.cfg = env.bindings[fnName];
                  var c2 = byn[b.cfg]; if (c2 && c2.model) b.model = c2.model;
                if (mname && b.fn === fnName) b.model = mname;
                });
                us.updated = env.updated;
                await Tools.Files.write(USGF, JSON.stringify(us, null, 2), false, "android");
              } catch (e4) { }
              return { success: true, active: env.active, bindings: env.bindings };
            } catch (e5) {
              return { success: false, error: String((e5 && e5.message) || e5) };
            }
          }
          try {
            var gr = await Tools.Net.http({ url: RELAY_BASE + "/app/history?limit=100", method: "GET", headers: H });
            var gb = String((gr && (gr.content || gr.body)) || "");
            var go = null; try { go = JSON.parse(gb); } catch (e) { go = null; }
            if (go && go.messages) { out.messages = go.messages; out.ok = true; }
          } catch (e2) { out.err = String((e2 && e2.message) || e2); }
          try { await Tools.Files.write(RELAY_TMP, JSON.stringify(out), false, "android"); } catch (e3) { }
          return { success: out.ok, sent: out.sent, error: out.err };
        } catch (e) {
          return { success: false, error: String((e && e.message) || e) };
        }
      },
    });
  }
  async function boot() {
    if (bootStarted.current) return;
    bootStarted.current = true;
    try {
      try {
        if (typeof ToolPkg !== "undefined" && ToolPkg.readResource) {
          var raw = await ToolPkg.readResource("zhaoge_html", "zhaoge.html");
          var p = null;
          if (typeof raw === "string") p = raw;
          else if (raw && typeof raw === "object") p = raw.path || raw.filePath || raw.content || raw.text || (typeof raw.data === "string" ? raw.data : null) || null;
          /* 新主页固定，旧单页不再接管 */
        }
      } catch (e) { }
      if (!HTML_PATH) HTML_PATH = HTML_FALLBACK_PATH;
      try {
        if (typeof ToolPkg !== "undefined" && ToolPkg.readResource) {
          var av1 = await ToolPkg.readResource("avatar_chaozhao", "avatar_chaozhao.jpg");
          var p1 = (typeof av1 === "string") ? av1 : (av1 && (av1.path || av1.filePath) || null);
          if (p1) AVATAR_PATHS.chaozhao = p1;
          var av2 = await ToolPkg.readResource("avatar_jinji", "avatar_jinji.jpg");
          var p2 = (typeof av2 === "string") ? av2 : (av2 && (av2.path || av2.filePath) || null);
          if (p2) AVATAR_PATHS.jinji = p2;
        }
      } catch (e) { }
      try { await Tools.Files.write(RELAY_TMP, JSON.stringify({ ok: false, messages: [] }), false, "android"); } catch (e) { }
      registerBridge();
      ready[1](true);
    } catch (e) {
      bootStarted.current = false;
    }
  }

  function handleResourceRequest(request) {
    var url = String(request && request.url ? request.url : "");
    if (url.indexOf("zhaoge.internal/relaybox") >= 0) {
      return zgJsonFile(RELAY_TMP);
    }
    /* 页面的手：拦截即落盘，不在拦截里等异步结果 */
    if (url.indexOf("zhaoge.internal/relay/send") >= 0) {
      var txt = zgQ(url, "text");
      if (txt) {
        zgReadJson(RELAY_OUT).then(function (arr) {
          var a = Array.isArray(arr) ? arr : [];
          a.push({ text: txt, at: Date.now() });
          return zgWriteJson(RELAY_OUT, a);
        });
      }
      return zgJsonFile(RELAY_ACK);
    }
    if (url.indexOf("zhaoge.internal/relay/set") >= 0) {
      var fnName = zgQ(url, "fn") || "CHAT";
      var cname = zgQ(url, "cfg");
      var mname = zgQ(url, "model");
      if (cname) {
        zgReadJson(RELAY_ENVF).then(function (env) {
          env = env || {};
          env.bindings = env.bindings || {};
          if (fnName === "CHAT") { env.active = cname; env.bindings.CHAT = cname; }
          else env.bindings[fnName] = cname;
          if (mname) {
            env.model_overrides = env.model_overrides || {};
            env.model_overrides[fnName] = mname;
            if (fnName === "CHAT") env.model_overrides.CHAT = mname;
          }
          var dd = new Date();
          env.updated = dd.getFullYear() + "-" + ("0" + (dd.getMonth() + 1)).slice(-2) + "-" + ("0" + dd.getDate()).slice(-2) + " " + ("0" + dd.getHours()).slice(-2) + ":" + ("0" + dd.getMinutes()).slice(-2) + ":" + ("0" + dd.getSeconds()).slice(-2);
          return zgWriteJson(RELAY_ENVF, env).then(function () {
            return zgReadJson(RELAY_USGF).then(function (us) {
              us = us || {};
              us.active = env.active || us.active;
              var byn = {};
              (us.configs || []).forEach(function (c) { byn[c.name] = c; });
              (us.bindings || []).forEach(function (b) {
                if (b.fn === "CHAT" && fnName === "CHAT") b.cfg = env.bindings.CHAT;
                if (fnName !== "CHAT" && b.fn === fnName) b.cfg = env.bindings[fnName];
                var c2 = byn[b.cfg]; if (c2 && c2.model) b.model = c2.model;
              });
              us.updated = env.updated;
              return zgWriteJson(RELAY_USGF, us);
            });
          });
        });
      }
      return zgJsonFile(RELAY_ACK);
    }
    if (url.indexOf("zhaoge.internal/relay/key") >= 0) {
      var kname = zgQ(url, "name");
      var kkey = zgQ(url, "key");
      var kmodel = zgQ(url, "model");
      var kend = zgQ(url, "endpoint");
      if (kname) {
        zgReadJson(RELAY_KEYIN).then(function (o) {
          o = o || {};
          o.name = kname; o.apiKey = kkey; o.model = kmodel; o.endpoint = kend; o.at = Date.now();
          return zgWriteJson(RELAY_KEYIN, o);
        });
      }
      return zgJsonFile(RELAY_ACK);
    }

    var mm = /zhaoge\.internal\/(.*)$/.exec(url);
    if (mm) {
      var rel = mm[1].split("?")[0].split("#")[0];
      if (!/^(avatar|vrmview|vrm|pet|catbase|cattail|cat|font)\b/.test(rel)) {
        var rp = rel;
        if (rp === "" || rp === "home") rp = "ui/home/home.html";
        else if (rp.indexOf("ui/") !== 0 && rp.indexOf("resources/") !== 0 && rp.indexOf("data.json") !== 0) rp = "ui/" + rp;
        var mime = "application/octet-stream";
        if (rp.indexOf(".html") > 0) mime = "text/html";
        else if (rp.indexOf(".json") > 0) mime = "application/json";
        else if (rp.indexOf(".js") > 0) mime = "application/javascript";
        else if (rp.indexOf(".css") > 0) mime = "text/css";
        else if (rp.indexOf(".jpg") > 0) mime = "image/jpeg";
        else if (rp.indexOf(".png") > 0) mime = "image/png";
        else if (rp.indexOf(".svg") > 0) mime = "image/svg+xml";
        else if (rp.indexOf(".woff") > 0) mime = "font/woff2";
        return buildFileResponse(mime, "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/" + rp);
      }
    }
    if (url.indexOf(VIRTUAL_URL) === 0 || url.indexOf(VIRTUAL_URL.split('?')[0]) === 0) {
      return buildFileResponse("text/html", HTML_PATH);
    }
    if (url.indexOf("zhaoge.internal/avatar/chaozhao") >= 0) {
      return buildFileResponse("image/jpeg", AVATAR_PATHS.chaozhao);
    }
    if (url.indexOf("zhaoge.internal/avatar/jinji") >= 0) {
      return buildFileResponse("image/jpeg", AVATAR_PATHS.jinji);
    }

    if (url.indexOf("zhaoge.internal/vrmview") >= 0) {
      return buildFileResponse("text/html", "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/resources/vrm_view.html");
    }
    if (url.indexOf("zhaoge.internal/vrm/") >= 0) {
      var vf = url.substring(url.lastIndexOf("/") + 1).split("?")[0];
      var vmime = "application/octet-stream";
      if (vf.indexOf(".js") >= 0) vmime = "application/javascript";
      else if (vf.indexOf(".html") >= 0) vmime = "text/html";
      return buildFileResponse(vmime, "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/resources/vrm/" + vf);
    }

    if (url.indexOf("zhaoge.internal/pet") >= 0) {
      return buildFileResponse("image/svg+xml", "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/resources/pet.svg");
    }

    if (url.indexOf("zhaoge.internal/catbase") >= 0) {
      return buildFileResponse("image/png", "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/resources/cat_base.png");
    }
    if (url.indexOf("zhaoge.internal/cattail") >= 0) {
      return buildFileResponse("image/png", "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/resources/cat_tail.png");
    }
    if (url.indexOf("zhaoge.internal/cat") >= 0) {
      return buildFileResponse("image/png", "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/resources/cat_jinji.png");
    }
    if (url.indexOf("zhaoge.internal/font/") >= 0) {
      var fn = url.substring(url.lastIndexOf("/") + 1).split("?")[0];
      return buildFileResponse("font/woff2", "/sdcard/Download/Operit/dev_package/com.jinji.zhaoge/resources/" + fn);
    }
    if (url.indexOf("zhaoge.internal/data") >= 0) {
      return buildFileResponse("application/json", "/sdcard/Download/Operit/plugins/zhaoge/data.json");
    }
    return { action: "allow" };
  }

  return UI.Box({
    fillMaxSize: true,
    containerColor: "#07060C",
    onLoad: boot,
  }, ready[0] ? [
    UI.WebView({
      controller: controller,
      key: "zhaoge_home_webview",
      url: VIRTUAL_URL,
      javaScriptEnabled: true,
      domStorageEnabled: true,
      useWideViewPort: true,
      loadWithOverviewMode: true,
      builtInZoomControls: false,
      displayZoomControls: false,
      backgroundColor: "#07060C",
      cacheMode: "noCache",
      onInterceptRequest: handleResourceRequest,
    }),
  ] : []);
}

module.exports = Screen;
module.exports.default = Screen;
module.exports.Screen = Screen;
