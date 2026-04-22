# ====================================================================
# HANOI VARNISH CONFIGURATION - HIGH PERFORMANCE VERSION
# ====================================================================

vcl 4.1;
import std;
import directors;

include "mobile_detect.vcl";

# ====================================================================
# LISTEN CONFIGURATION
# ====================================================================

# Listen on Unix domain socket for local HAProxy
# vcl 4.1; removed duplicate

# ====================================================================
# BACKEND DEFINITIONS (Enhanced with aggressive health checks)
# ====================================================================

backend default { .host = "192.168.80.139"; .port = "80"; }
# backend jboss120 { .host = "192.168.80.120"; .port = "8080"; }

backend jboss121 {
    .host = "192.168.80.121";
    .port = "8080";
    .probe = {
        .request = "GET / HTTP/1.1"
                   "Host: xskt.com.vn"
                   "x-forwarded-proto: https"
                   "Connection: close";
        .interval = 30s;
        .window = 5;
        .threshold = 3;
    }
}

backend java128sg {
    .host = "192.168.9.128";
    .port = "8080";
    .probe = {
        .request = "GET / HTTP/1.1"
                   "Host: xskt.com.vn"
                   "x-forwarded-proto: https"
                   "Connection: close";
        .interval = 30s;
        .window = 4;
        .threshold = 3;
    }
}

backend jboss122 { .host = "192.168.80.122"; .port = "8080"; }
backend jboss123 { .host = "192.168.80.123"; .port = "8080"; }
backend jboss124 { .host = "192.168.80.124"; .port = "8080"; }
backend jboss125 { .host = "192.168.80.125"; .port = "8080"; }

backend nginx131 { .host = "192.168.80.131"; .port = "80"; }
backend nginx137 { .host = "192.168.80.137"; .port = "80"; }
backend nginx134 { .host = "192.168.80.134"; .port = "80"; }
#backend nginx135 { .host = "192.168.80.135"; .port = "80"; }
backend freexosomn { .host = "192.168.9.131"; .port = "80"; }
backend freexosodev { .host = "192.168.80.187"; .port = "80"; }

backend odoo173 { .host = "192.168.80.173"; .port = "8069"; }
backend kutt183 { .host = "192.168.80.183"; .port = "3000"; }
backend openproject { .host = "192.168.80.240"; .port = "80"; }

backend deepseek {
    .host = "192.168.80.242";
    .port = "8080";
    .first_byte_timeout = 360s;
    .between_bytes_timeout = 360s;
    .connect_timeout = 60s;
}

backend lumise { .host = "192.168.80.138"; .port = "80"; }
backend appxskt { .host = "192.168.80.129"; .port = "80"; }
backend best2buy { .host = "192.168.86.130"; .port = "80"; }
backend charity { .host = "192.168.80.241"; .port = "3000"; }
backend map { .host = "192.168.80.184"; .port = "8080"; }
backend mapv2 { .host = "192.168.80.184"; .port = "8081"; }
backend tts { .host = "192.168.80.243"; .port = "8000"; }
backend hoan { .host = "192.168.1.87"; .port = "5000"; }
backend pdf { .host = "192.168.80.189"; .port = "80"; }
backend nodejs80139 {
    .host = "192.168.80.139";
    .port = "80";
    .first_byte_timeout = 600s;
    .between_bytes_timeout = 600s;
    .connect_timeout = 60s;
}
backend nodejs123 { .host = "192.168.1.23"; .port = "80"; }

# ====================================================================
# ACL & INIT
# ====================================================================

acl purge {
    "localhost";
    "192.168.80.0"/24;
    "10.0.1.0"/24;
}

sub vcl_init {
    new xskt_director = directors.fallback();
    xskt_director.add_backend(jboss121);
    xskt_director.add_backend(java128sg);
}

# ====================================================================
# REQUEST PROCESSING (vcl_recv)
# ====================================================================

sub vcl_recv {

    # --- Mobile Detection for non-static files ---
    call devicedetect;
    
    # 1. Chuẩn hóa Accept-Encoding để tránh phân mảnh cache (Tăng HIT rate)
    if (req.http.Accept-Encoding) {
        if (req.http.Accept-Encoding ~ "gzip") {
            set req.http.Accept-Encoding = "gzip";
        } elseif (req.http.Accept-Encoding ~ "br") {
            set req.http.Accept-Encoding = "br";
        } else {
            unset req.http.Accept-Encoding;
        }
    }
    
    # 1. Purge Logic
    if (req.method == "PURGE") {
        if (!client.ip ~ purge) {
            return (synth(405, "Not allowed."));
        }
        if (req.http.X-Purge-Method == "regex") {
            ban("req.http.host ~ " + req.http.host + " && req.url ~ " + req.url);
            return (synth(200, "Banned"));
        }
        return (purge);
    }
    if (req.url ~ ".*purge$") {
        set req.http.X-Purge = regsub(req.url, "(.*)purge$", "\1");
        ban("req.http.host ~ " + req.http.host + " && req.url ~ " + req.http.X-Purge);
        return (purge);
    }

    # 2. Status & Hooks
    if (req.url == "/varnish-status") {
        return(synth(200, "OK"));
    }

    # Domains verification
    if (req.url ~ ".well-known") {
        set req.http.host = "freexoso.com";
        set req.backend_hint = freexosomn;
        return(pass);
    }

    # 3. Special Logic (Pre-routing)
    if (req.http.host ~ "tttt") {
        unset req.http.Cookie;
        set req.backend_hint = jboss121;
    }

    # ==================== OPTIMIZED ROUTING ====================

    # --- Specific Subdomains (High Priority) ---
    if (req.http.host ~ "^(doc|doctt)\.xskt\.com\.vn$") {
        set req.http.host = "freexoso.com";
        set req.backend_hint = nginx134;
    }
    elseif( req.http.host == "dev.freexoso.com"
	 || req.http.host == "kqsx.top"
	 || req.http.host == "static.kqsx.top"
	 || req.http.host == "www.kqsx.top"
         || req.http.host == "ve-so.com"
         || req.http.host == "static.ve-so.com"
         || req.http.host == "www.ve-so.com"
	){
  	set req.backend_hint = freexosodev;
	return(pass);
    }
    elseif (req.http.host == "charity.opnai.net" || req.http.host ~ "nhadat\.(life|city)") {
        set req.backend_hint = charity;
        return(pass);
    }
    elseif (req.http.host == "map.opnai.net") {
        set req.backend_hint = map;
        return(pass);
    }
    elseif (req.http.host == "map2.opnai.net") {
        set req.backend_hint = mapv2;
        return(pass);
    }
    elseif (req.http.host == "stt.opnai.net") {
        set req.backend_hint = hoan;
        return(pass);
    }
    elseif (req.http.host == "chat.opnai.net") {
        set req.backend_hint = deepseek;
        return(pass);
    }
    elseif (req.http.host == "tts.opnai.net") {
        set req.backend_hint = tts;
    }
    elseif (req.http.host == "apis.xskt.com.vn") {
        set req.backend_hint = appxskt;
        return(pass);
    }

    # SPECIAL: Remove ALL cookies for xskt.com.vn immediately (no cookies needed)
    if (req.http.host ~ "xskt\.com\.vn") {
        set req.backend_hint = xskt_director.backend();
        unset req.http.Cookie;
        unset req.http.Pragma;
        unset req.http.Cache-Control;
        # Clean URL parameters if needed
        if(req.url ~ "zzz"){
            set req.url = regsuball(req.url,"(rr)=([^&]*)","");
        }
        return(hash);
    }

    # --- XSKT Director & Related ---
    elseif (req.http.host ~ "xskt\.com\.vn" || req.http.host ~ "s\.tainhaccho\.vn") {
        set req.backend_hint = xskt_director.backend();
    }

    # --- Nhac Cho Group (JBOSS 122) ---
    elseif (req.http.host ~ "((tai|cai)nhaccho\.(net|vn|org)|nhacchuongmienphi\.com|tainhacchuong\.(org|vn)|loibaihat\.(biz|me))") {
        set req.backend_hint = jboss122;
    }

    # --- News/Edu Group (JBOSS 123) ---
    elseif (req.http.host ~ "(nguoinoitieng\.tv|kienthuckhoahoc\.org|nhuongve\.info|vieclam\.tv|sachgiaokhoa\.info|lehoi\.info|tracuudiemthi\.edu\.vn|tinbds\.com|nganhangs\.com|doanhnghiep\.me)") {
        set req.backend_hint = jboss123;
    }

    # --- KQXS Group 1 (JBOSS 124) ---
    elseif (req.http.host ~ "(ketquahomnay\.net|kqxs\.me)") {
        set req.backend_hint = jboss124;
    }

    # --- KQXS Group 2 (JBOSS 125) ---
    elseif (req.http.host ~ "(kqxs\.net\.vn|xskt\.me|xoso3mien\.net|kqxs\.info|kqxs\.mobi)") {
        set req.backend_hint = jboss125;
    }

    # --- Nginx 131 Misc ---
    elseif (req.http.host ~ "(nhadat\.city|xemtuvi\.xyz|tuvixyz\.com|cachlam\.org|huongdanabc\.xyz|meoluoi\.club|xemgihomnay\.net|xemgihay\.com|cliphay\.video)") {
        set req.backend_hint = nginx131;
    }
    elseif (req.http.host == "pdf.zzz.vn" 
	   || req.http.host == "ngaytot.zzz.vn" 		
	) {
        set req.backend_hint = pdf;
    }
    elseif (req.http.host ~ "(fun\.zzz\.vn|wallphone\.mobi|s2\.zzz\.vn)") {
        set req.backend_hint = nginx131;
    }

    # --- Opnai & AI Tools ---
    elseif (req.http.host ~ "s\.zzz\.vn" || req.http.host ~ "short.opnai.net") {
        set req.backend_hint = kutt183;
    }
    elseif (req.http.host ~ "(opai\.biz|lunai\.art|opnai\.net|chatgpt\.cotuong\.xyz)") {
        set req.backend_hint = nginx137;
        if (req.http.host ~ "media") {
            return(pass);
        }
    }
    elseif (req.http.host ~ "best2buy.reviews") {
        set req.backend_hint = best2buy;
        return(pass);
    }
elseif( req.http.host == "dev.cotuong.xyz"){
 set req.backend_hint = nodejs123;
}
    elseif (req.http.host ~ "cotuong.xyz") {
        set req.backend_hint = nodejs80139;
    }
    elseif (req.http.host ~ "(paint\.hmt\.asia|thietkeao\.net|thietkeao\.top)") {
        set req.backend_hint = lumise;
        return(pass);
    }

    # --- HMT Asia Redirects (Odoo/Project) ---
    elseif (req.http.host ~ "hmt\.asia") {
        if (req.http.X-Forwarded-Proto !~ "https") {
            set req.http.x-redir = "https://" + req.http.host + req.url;
            return(synth(850, "Moved permanently"));
        }
        if (req.http.host == "project.hmt.asia") {
            set req.backend_hint = openproject;
        } else {
        set req.backend_hint = odoo173;
    }
        return(pass);
    }

    # --- The "Big List" (Nginx 134) ---
    elseif (
        req.http.host ~ "freexoso\.com" ||
        req.http.host ~ "(tracnghiem|s1|dulieu|mobi|xoso|account|support)\.zzz\.vn" ||
        req.http.host ~ "(geoip|gamehot|pres|diemthi24h)\.(hmt\.asia|vn)" ||
        req.http.host ~ "^123\.30\.145\.(197|196|208|239|133|134)$" ||
        req.http.host ~ "(congai\.mobi|s\.congai\.zzz\.vn|gamehaynhat\.mobi|reviewgame\.org)" ||
        req.http.host ~ "tradiemthi\.(net|zzz\.vn)" ||
        req.http.host ~ "(kqbd\.info|hoangan\.biz|camnangsong\.org|diemthitotnghiepthpt\.asia|cotuong\.zzz\.vn|v2\.tradiemthi\.net)" ||
        req.http.host ~ "(hinh-nen\.org|hinhdep\.com\.vn|ketquaxoso888\.com|diadiemthi\.net|xoso\.club)"
    ) {
        set req.backend_hint = nginx134;      
    }
    else {
        # Default Fallback
        set req.backend_hint = nginx131;
    }

    # ==================== COOKIE & CACHE CONTROL ====================

    # Clean cookies for specific domains
    if ((req.http.host ~ "s1.zzz.vn" || req.http.host ~ "f1.freexoso.com") && req.url !~ "admin") {
        # --- Mobile Detection ---
        unset req.http.Cookie;
        unset req.http.Pragma;
        unset req.http.Cache-Control;
        set req.url = regsuball(req.url, "&(r|cb|loc|referer)=([^&]*)", "");
        return(hash);
    }

    if (req.http.host ~ "xskt.com.vn") {
        unset req.http.Cookie;
        if (req.url ~ "zzz") {
            set req.url = regsuball(req.url, "(rr)=([^&]*)", "");
        }
        return(hash);
    }

    # Global disable cache URIs
    if (req.url ~ "^/(report|qldv|Gateway|itme|touch|wp-admin|wp-login|oauth|sitemap|thanh-toan|pay|sms|download|gateway|admin|jsps|captcha|temp)") {
        return(pass);
    }

    # Domain specific cache disable
    if (req.http.host ~ "(112\.213\.94\.(50|49|20)|xoso\.zzz\.vn|xoso\.club|meoluoi\.club|geoip\.)") {
        return(pass);
    }
    if (req.http.host ~ "(fun\.zzz\.vn|wallphone\.mobi|account\.zzz\.vn|cachlam\.org)") {
        return(pass);
    }

    # Large files
    if (req.url ~ "\.(mp3|flv|mov|mp4|mpg|mpeg|avi|dmg)$" || req.url ~ "^/(music)") {
        unset req.http.cookie;
        return(pass);
    }

    # Standard Varnish Logic
    if (req.method == "POST") { return (pass); }
    if (req.http.X-Requested-With == "XMLHttpRequest") { unset req.http.X-Requested-With; }

    # --- Mobile Detection ---

    # Force Cache Statics
    if (req.url ~ "\.(jpg|jpeg|gif|png|css|js|swf|ico|smi|webp|woff|woff2)$") {
        # --- Mobile Detection ---
       
        unset req.http.Cookie;
        unset req.http.Cache-Control;
        unset req.http.Pragma;
        return(hash);
    }


    # --- SEO BOT DETECTION (BYPASS CACHE) ---
    # Moved to end so backend_hint is already set
    if (req.http.User-Agent ~ "(?i)(facebookexternalhit|facebook|facebot|twitterbot|googlebot|bingbot|linkedinbot|whatsapp|viber|telegrambot|bot|node|opengraph|axios|fetch|meta|orcascan|externalagent|crawler|spider|checker|validator|preview|inspect|parse)") {
        return(pass);
    }

    if (req.http.Authorization || req.http.Cookie) {
        return (pass);
    }
}

# ====================================================================
# HASHING
# ====================================================================

sub vcl_hash {
    if (req.http.X-Forwarded-Proto) { hash_data(req.http.X-Forwarded-Proto); }
    if (req.http.X-UA-Device) { hash_data(req.http.X-UA-Device); }
    if (req.http.Accept-Encoding) { hash_data(req.http.Accept-Encoding); }
    hash_data(req.http.host);
    hash_data(req.url);
    return(lookup);
}

# ====================================================================
# SMART COOKIE HANDLING
# ====================================================================
sub smart_cookie_handler {
    # Remove all cookies for static content (images, css, js, fonts)
    if (bereq.url ~ "\.(jpg|jpeg|gif|png|css|js|swf|ico|smi|webp|woff|woff2)$") {
        unset bereq.http.Cookie;    
        return;
    }
    
    # Filter only third-party cookies, keep all first-party cookies
    if (bereq.http.Cookie) {
        # Remove third-party tracking and analytics cookies
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *_?_utm[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *_?_ga[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *_?_gads[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *_?_gid[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *_?_a3rd[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *_?_cf[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *ADB3rd[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *ad_[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *adv_[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *au_[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *_?_[RU][^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *fosp_[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *_?_cfduid[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *MarketGidStorage[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *_?_im_uid[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *_?_fb[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *fb[^=]*=[^;]*", "");
        set bereq.http.Cookie = regsuball(bereq.http.Cookie, "(^|; ) *twk[^=]*=[^;]*", "");
        
        # Clean up cookie header
        set bereq.http.Cookie = regsub(bereq.http.Cookie, "^;\s*", "");
        if (bereq.http.Cookie == "") {
            unset bereq.http.Cookie;
        }
        

        return;
    }
    

}

# ====================================================================
# BACKEND RESPONSE
# ====================================================================
sub vcl_backend_response {

    if (!beresp.http.Content-Encoding && 
        beresp.http.content-type ~ "(text/|application/(json|xml|javascript|javascript\+json))") {
        set beresp.do_gzip = true;
    }

# Mark response as device-dependent for caching
    if (bereq.http.X-UA-Device) {
        if (!beresp.http.Vary) { set beresp.http.Vary = "X-UA-Device"; }
        elseif (beresp.http.Vary !~ "X-UA-Device") { set beresp.http.Vary = beresp.http.Vary + ", X-UA-Device"; }
    }

    if (beresp.http.Content-Encoding) {
        if (!beresp.http.Vary) {
            set beresp.http.Vary = "Accept-Encoding";
        } elseif (beresp.http.Vary !~ "Accept-Encoding") {
            set beresp.http.Vary = beresp.http.Vary + ", Accept-Encoding";
        }
    }

    # Handle 416 Range Not Satisfiable - retry without range for TTS
    if (beresp.status == 416 && bereq.retries < 1 && bereq.url ~ "/gateway/ttsa/tts") {
        unset bereq.http.Range;
        return(retry);
    }


    # Apply smart cookie handling LAST to preserve X-C header
    call smart_cookie_handler;

  
}

# ====================================================================
# DELIVER
# ====================================================================
sub vcl_deliver {
    unset resp.http.Via;
    unset resp.http.X-Powered-By;

    if (server.hostname) {
        set resp.http.Server = regsub(server.hostname, "^.{5}", "");
    }

    return (deliver);
}

# ====================================================================
# BACKEND ERROR
# ====================================================================
sub vcl_backend_error {
   
    
    # Handle 416 Range Not Satisfiable - retry without range for TTS
    if (beresp.status == 416 && bereq.retries < 1 && bereq.url ~ "/gateway/ttsa/tts") {
        unset bereq.http.Range;
        return(retry);
    }   

    
    # Let HAProxy handle error pages via errorfile configuration
    return(deliver);
}

# ====================================================================
# SYNTH
# ====================================================================
sub vcl_synth {
    if (resp.status == 850) {
        set resp.http.Location = req.http.x-redir;
        set resp.status = 302;
        return (deliver);
    }
    if (resp.status == 200) {
        synthetic({"OK"});
        return(deliver);
    }
    
    # Let HAProxy handle error pages via errorfile configuration
    return(deliver);
}
