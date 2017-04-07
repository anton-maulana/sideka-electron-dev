var $ = require('jquery');
var jetpack = require('fs-jetpack');
var moment = require('moment');
var path = require('path');

import { remote, ipcRenderer } from "electron";
import { LocationStrategy, HashLocationStrategy } from "@angular/common";
import { BrowserModule, DomSanitizer } from "@angular/platform-browser";
import { enableProdMode, NgModule, Component, Inject, NgZone } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { RouterModule, Router, Routes,ActivatedRoute } from "@angular/router";
import { HttpModule } from "@angular/http";
import UndoRedoComponent from './components/undoRedo';
import CopyPasteComponent from './components/copyPaste';
import OnlineStatusComponent from './components/onlineStatus';
import SuratComponent from "./components/surat";

import PerencanaanComponent from './pages/perencanaan';
import ApbdesComponent from './pages/apbdes';
import PendudukComponent from './pages/penduduk';
import KeluargaComponent from './pages/keluarga';
import IndikatorComponent from './pages/indikator'

import * as fs from 'fs';
import * as os from 'os'; // native node.js module
import env from './env';
import dataapi from './stores/dataapi';
import feedapi from './stores/feedapi';
import v2Dataapi from './stores/v2Dataapi';
import * as request from 'request';
import { Siskeudes } from './stores/siskeudes';

var pjson = require("./package.json");
if(env.name == "production")
    enableProdMode();

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());
var DATA_DIR = app.getPath("userData");
var CONTENT_DIR = path.join(DATA_DIR, "contents");
const allContents ={rpjmList:true,config:true,feed:true};

function extractDomain(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }

    //find & remove port number
    domain = domain.split(':')[0];

    return domain;
}

$("#titlebar-close-button").click(function(){ remote.getCurrentWindow().close(); return false; })
$("#titlebar-maximize-button").click(function(){ 
    remote.getCurrentWindow().isMaximized() ? remote.getCurrentWindow().unmaximize() : remote.getCurrentWindow().maximize(); 
    return false;
})
$("#titlebar-minimize-button").click(function(){ remote.getCurrentWindow().minimize(); return false; })

@Component({
    selector: 'front',
    templateUrl: 'templates/front.html',
})
class FrontComponent{
    auth: any;
    package: any;
    file: any;
    logo: string;

    siskeudes:any;
    siskeudesPath: string;
    visiRPJM:any;
    
    feed: any;
    desas: any;
    loginErrorMessage: string;
    loginUsername: string;
    loginPassword: string;
    maxPaging: number;
    contents:any;
 
    constructor(private sanitizer: DomSanitizer, private zone: NgZone) {
        this.contents = Object.assign({}, allContents);
        this.toggleContent("feed");
        this.maxPaging = 0;
    }

    ngOnInit(){
        $("title").html("Sideka");
        this.auth = dataapi.getActiveAuth();
        this.loadSetting();
        this.loadSiskeudesPath();
        this.package = pjson;
        var ctrl = this;
        if(this.auth){
            //Check whether the token is still valid
            dataapi.checkAuth( (err, response, body) => {
                if(!err){
                    var json = JSON.parse(body);
                    if(!json.user_id){
                        ctrl.zone.run(() => {
                            ctrl.auth = null;
                            dataapi.saveActiveAuth(null);
                           
                        });
                    }
                }
            })
        }

        dataapi.saveNextOfflineContent();
        feedapi.getOfflineFeed(data => {
                this.zone.run(() => {
                    this.feed = this.convertFeed(data);
                    this.desas = dataapi.getOfflineDesa();
                    this.loadImages();
                });
        });
        dataapi.getDesa(desas => {
            feedapi.getFeed(data => {
                this.zone.run(() => {
                    this.feed = this.convertFeed(data);
                    this.desas = desas;
                    this.loadImages();
                });
            });
        });
        ipcRenderer.on("updater", (event, type, arg) => {
            if(type == "update-downloaded"){
                $("#updater-version").html(arg);
                $("#updater").removeClass("hidden");
            }
        });
        $("#updater-btn").click(function(){
            ipcRenderer.send("updater", "quitAndInstall");
        });
    }
    
    getDate(item){
        var date = moment(new Date(item.pubDate));
        var dateString = date.fromNow();
        if(date.isBefore(moment().startOf("day").subtract(3, "day"))){
            dateString = date.format("LL");
        }
        return dateString;
    }
    
    getDesa(item){
        var itemDomain = extractDomain(item.link);
        var desa = this.desas.filter(d => d.domain == itemDomain)[0];
        return desa && desa.desa ? desa.desa + " - " + desa.kabupaten : "-";
    }
    
    loadImages(){
        var searchDiv = document.createElement("div");
        this.feed.forEach(item => {
            feedapi.getImage(searchDiv, item.link, image => {
                this.zone.run(() => {
                    if (image)
                        image = this.sanitizer.bypassSecurityTrustStyle("url('"+image+"')");
                    item.image = image;
                });
            })
        });
    }
    
    convertFeed(data){
        var $xml = $(data);
        var items = [];
        $xml.find("item").each(function(i) {
            if (i === 30) return false;
            var $this = $(this);

            items.push({
                title: $this.find("title").text(), 
                link:$this.find("link").text(),
                description: $this.find("description").text(),
                pubDate: $this.find("pubDate").text(),
            });                
        });
        return items;
    }

    login(){
        this.loginErrorMessage = null;
        var ctrl = this;
        v2Dataapi.login(this.loginUsername, this.loginPassword, function(err, response, body){
            ctrl.zone.run(() => {
                console.log(err, response, body);
                if(!err && body.success){
                    ctrl.auth = body;
                    console.log(ctrl.auth);
                    dataapi.saveActiveAuth(ctrl.auth);
                } else {
                    var message = "Terjadi kesalahan";
                    if(err) {
                        message += ": "+err.code;
                        if(err.code == "ENOTFOUND")
                            message = "Tidak bisa terkoneksi ke server";
                    }
                    if(body && !body.success)
                        message = "User atau password Anda salah";
                    ctrl.loginErrorMessage = message;
                }
            });
        });
        return false;
    }

    logout(){
        this.auth = null;
        v2Dataapi.logout();
        return false;
    }

    loadSetting(): void{
        let dataFile = path.join(DATA_DIR, "setting.json");

        if(!jetpack.exists(dataFile))
            return null;

        let data = JSON.parse(jetpack.read(dataFile));
        this.logo = data.logo;
        $('#input-jabatan').val(data.jabatan);
        $('#input-sender').val(data.sender);
        this.maxPaging = data.maxPaging;
    }

    loadSiskeudesPath(){
        let dataFile = path.join(DATA_DIR, "siskeudesPath.json");
        if(!jetpack.exists(dataFile))
            return null;
        let data = JSON.parse(jetpack.read(dataFile));
        this.siskeudesPath = data.path;
        this.siskeudes = new Siskeudes(this.siskeudesPath);
    }

    fileChangeEvent(fileInput: any){
        let file = fileInput.target.files[0];
        let extensionFile = file.name.split('.').pop();

        if(extensionFile =='mde'|| extensionFile =='mdb'){
            this.siskeudesPath = file.path;
        }else{  
            this.file = fs.readFileSync(file.path).toString('base64'); 
        }   
    }

    saveSetting(): void{
        let data = {
            "jabatan": $('#input-jabatan').val(),
            "sender": $('#input-sender').val(),
            "logo": this.file,
            "maxPaging": this.maxPaging
        };
            
        let dataFile = path.join(DATA_DIR, "setting.json");
        
        if(this.auth)
            jetpack.write(dataFile, JSON.stringify(data));
            
        this.loadSetting();
    }

    saveSiskeudesDBPath():void{
        let data = {
            "path": this.siskeudesPath
        }
        let dataFile = path.join(DATA_DIR, "siskeudesPath.json");

        if(this.auth)
            jetpack.write(dataFile, JSON.stringify(data));    
        this.loadSiskeudesPath();   
    }
    
    getVisiRPJM():void{            
        this.siskeudes.getVisiRPJM(data=>{
            this.zone.run(() => { // <== added
                this.visiRPJM = data;
             });         
        })     
        this.toggleContent('rpjmList')
    }

    toggleContent(content){   
        this.contents = Object.assign({}, allContents);
        this.contents[content] = false;
    }
}

@Component({
    selector: 'app',
    template: '<router-outlet></router-outlet>'
})
class AppComponent{
    constructor(){}
}

@NgModule({
    imports: [ 
        BrowserModule,
        FormsModule,
        RouterModule.forRoot([
            { path: 'penduduk', component: PendudukComponent },
            { path: 'keluarga', component: KeluargaComponent },
            { path: 'apbdes', component: ApbdesComponent },
            { path: 'perencanaan', component: PerencanaanComponent },
            { path: 'indikator', component: IndikatorComponent },
            { path: '', component: FrontComponent, pathMatch: 'full'},
        ]),
    ],
    declarations: [
        AppComponent, 
        FrontComponent, 
        ApbdesComponent, 
        PerencanaanComponent,
        IndikatorComponent,
        KeluargaComponent, 
        PendudukComponent, 
        UndoRedoComponent, 
        CopyPasteComponent, 
        OnlineStatusComponent,
        SuratComponent,
    ],
    providers: [{provide: LocationStrategy, useClass: HashLocationStrategy}],
    bootstrap: [AppComponent]
})
class SidekaModule{
    constructor(){}
}

document.addEventListener('DOMContentLoaded', function () {
    //platformBrowserDynamic().bootstrapModule(SidekaModule);
});
platformBrowserDynamic().bootstrapModule(SidekaModule);