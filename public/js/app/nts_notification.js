
// USES:
// NTS_ANIM
// NTS_UTIL

// USED IN:
// NTS_PLAYER_C

// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
// Untypescript 2023 by Kearnan Kelly

"use strict";

let NTS_NOTIFICATION = {

    notifying: false,

    notify: function (msg) {
        let elTxt = NTS_UTIL.$e('notification_text');
        elTxt.textContent = msg;
        
        if (NTS_NOTIFICATION.notifying) {
            return;
        }
            
        let el = NTS_UTIL.$e('notification');
        el.style.display = 'block';
        el.style.opacity = '1.0';
        
        NTS_NOTIFICATION.notifying = true;
        
        setTimeout(function () {
            NTS_ANIM.fadeOut(el, 1000, function () {
                el.style.display = 'none';
                elTxt.textContent = '';
                NTS_NOTIFICATION.notifying = false;
            });
        }, 4000);
    }
};

