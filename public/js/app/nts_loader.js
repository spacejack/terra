/*global THREE*/

// USES:
// THREE

// USED IN:
// NTS_APP_C

// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
// Untypescript 2023 by Kearnan Kelly

"use strict";

let NTS_LOADER = {

    isLoading: false,
    totalToLoad: 0,
    numLoaded: 0,
    numFailed: 0,
    success_callback: null,
    progress_callback: null,
    error_callback: null,
    done_cb: null,
    
    assets: {images: {}, text: {}, textures: {}},
    
    // Start loading a list of assets
    load: function (assetList, onAssetsLoaded, onAssetsProgress, onAssetsError, onAssetsDone) {
        this.success_callback = onAssetsLoaded;
        this.progress_callback = onAssetsProgress;
        this.error_callback = onAssetsError;
        this.done_cb = onAssetsDone;
        this.totalToLoad = 0;
        this.numLoaded = 0;
        this.numFailed = 0;
        this.isLoading = true;

        if (assetList.text) {
            this.totalToLoad += assetList.text.length;
            for (let i = 0; i < assetList.text.length; ++i) {
                this.loadText(assetList.text[i]);
            }
        }

        if (assetList.images) {
            this.totalToLoad += assetList.images.length;
            for (let i = 0; i < assetList.images.length; ++i) {
                this.loadImage(assetList.images[i]);
            }
        }

        if (assetList.textures) {
            this.totalToLoad += assetList.textures.length;
            for (let i = 0; i < assetList.textures.length; ++i) {
                this.loadTexture(assetList.textures[i]);
            }
        }
    },

    loadText: function (ad) {
        
        let req = new XMLHttpRequest();
        req.overrideMimeType('*/*');
        req.onreadystatechange = () => {
            if (req.readyState === 4) {
                if (req.status === 200) {
                    this.assets.text[ad.name] = req.responseText;
                    this.doProgress();
                } else {
                    this.doError("Error " + req.status + " loading " + ad.url);
                }
            }
        };
        req.open('GET', ad.url);
        req.send();
    },

    loadImage: function (ad) {
        // maintaining a 'pointer' to 'this'
        let doProgressCallback = this.doProgress(this);

        let img = new Image();
        this.assets.images[ad.name] = img;
        img.onload = doProgressCallback;
        img.onerror = this.doError;
        img.src = ad.url;
    },

    loadTexture: function (ad) {
        let doProgressCallback = this.doProgress(this);
        this.assets.textures[ad.name] = new THREE.TextureLoader().load(ad.url, doProgressCallback);
    },

    doProgress: function () {
        this.numLoaded += 1;
        this.progress_callback && this.progress_callback(this.numLoaded / this.totalToLoad);
        this.tryDone();
    },

    doError: function (e) {
        this.error_callback && this.error_callback(e);
        this.numFailed += 1;
        this.tryDone();
    },

    tryDone: function () {
        if (!this.isLoading) {
            return true;
        }
        if (this.numLoaded + this.numFailed >= this.totalToLoad) {
            let ok = !this.numFailed;
            if (ok && this.success_callback) {
                this.success_callback(this.assets);
            }
            this.done_cb && this.done_cb(ok);
            this.isLoading = false;
        }
        return !this.isLoading;
    },

    getAssets: function () {
        return this.assets;
    }

};
