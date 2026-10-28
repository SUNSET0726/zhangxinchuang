package com.jinji.zhaoge.test;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {

    private WebView wv;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        wv = new WebView(this);
        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);

        wv.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                String u = req.getUrl().toString();
                if (!u.startsWith("https://zhaoge.internal/")) return null;
                String path = u.substring("https://zhaoge.internal/".length());
                int q = path.indexOf('?');
                if (q >= 0) path = path.substring(0, q);

                String asset = null;
                String mime = null;
                if (path.equals("data.json")) { asset = "data.json"; mime = "application/json"; }
                else if (path.equals("font/zhaoge_font.woff2")) { asset = "zhaoge_font.woff2"; mime = "font/woff2"; }
                else if (path.equals("catbase")) { asset = "cat_base.png"; mime = "image/png"; }
                else if (path.equals("cattail")) { asset = "cat_tail.png"; mime = "image/png"; }
                else if (path.equals("avatar/jinji")) { asset = "avatar_jinji.jpg"; mime = "image/jpeg"; }
                else if (path.equals("avatar/chaozhao")) { asset = "avatar_chaozhao.jpg"; mime = "image/jpeg"; }

                if (asset == null) {
                    return new WebResourceResponse("text/plain", "UTF-8",
                            new ByteArrayInputStream("".getBytes()));
                }
                try {
                    InputStream is = getAssets().open(asset);
                    WebResourceResponse r = new WebResourceResponse(mime, "UTF-8", is);
                    Map<String, String> h = new HashMap<>();
                    h.put("Access-Control-Allow-Origin", "*");
                    h.put("Cache-Control", "no-cache");
                    r.setResponseHeaders(h);
                    return r;
                } catch (IOException e) {
                    return null;
                }
            }
        });

        wv.loadUrl("file:///android_asset/zhaoge.html");
        setContentView(wv);
    }

    @Override
    public void onBackPressed() {
        if (wv != null && wv.canGoBack()) wv.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (wv != null) wv.destroy();
        super.onDestroy();
    }
}
