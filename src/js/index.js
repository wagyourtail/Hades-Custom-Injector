const { remote } = require('electron');
const request = require('request');
const fs = require('fs');
const admzip = require('adm-zip');
const ncp = require('ncp').ncp;
const { exec } = require("child_process");
//window stuff
title.innerHTML = `<b>Hades Client</b> v${remote.app.getVersion()} &nbsp; by WagYourTail`;
minBtn.addEventListener("click", () => {remote.BrowserWindow.getFocusedWindow().minimize()});
closeBtn.addEventListener("click", window.close);

//auto update injector

request("https://github.com/wagyourtail/Hades-Custom-Injector/releases/latest", (err,res,body) => {
    let http = new DOMParser().parseFromString(body, "text/html");
    let version = http.getElementsByClassName("d-flex flex-justify-between py-1 py-md-2 Box-body px-2")[0].getElementsByTagName("a")[0];
    console.log(`hades-injector.Setup.${remote.app.getVersion()}.exe`)
    if (version.innerText != `hades-injector.Setup.${remote.app.getVersion()}.exe` && remote.app.getVersion() != process.versions.electron) {
        request.get(version.href.replace(/file:\/\/\/[A-Z]:/, "https://github.com")).on('close', () => {
            exec(`${process.env.APPDATA}/hades-cli/newest.exe`);
            setTimeout(window.close, 200);
        }).pipe(fs.createWriteStream(`${process.env.APPDATA}/hades-cli/newest.exe`));
    }
});



// functions and shit

let loginCookie = null;
let saveData = {vers:{}};

function login() {
    return new Promise((resolve,reject) => {
        let formData = {
            login:loginField.value,
            password:passwordField.value
        }
        request.post({url:"https://hadesgta.com/forum/index.php?login/login", formData: formData}, (err,res,body) => {
            loginCookie = res.headers['set-cookie'];
            if (loginCookie[1].startsWith("xf_session")) {
                saveData.login = formData.login;
                saveData.password = formData.password;
                writeJSON(`${process.env.APPDATA}/hades-cli/data.json`, saveData);
                banner.style = null;
                changelog.style = null;
                runButton.style = null;
                loginForm.style.display = "none";
                resolve();
            } else {
                reject();
            }
        });
    });
}

function versions() {
    return new Promise((resolve,reject) => {
        request({url:'https://hadesgta.com/forum/index.php?forums/15/', headers: {Cookie:loginCookie}}, (err, res, body) => {
            let http = new DOMParser().parseFromString(body, "text/html");
            let vers = [];
            Array.from(http.getElementsByClassName("structItem-title")).forEach((e) => {
                let ver = e.getElementsByTagName("a")[1];
                vers.push({id:ver.innerHTML.match(/\d+\.\d+\.\d+/), href:ver.href.replace(/file:\/\/\/[A-Z]:/, "https://hadesgta.com")});
            });
            resolve(vers);
        });
    });
}


function writeJSON(JSONFile, JSONObject) {
    return new Promise((resolve, reject) => {
        fs.writeFile(JSONFile, JSON.stringify(JSONObject, null, '\t'), 'utf8', (err) => {
        if (err) return reject(err);
        return resolve('File saved');
        });
    });
}

function openJSON(JSONFile) {
    return new Promise((resolve, reject) => {
        fs.readFile(JSONFile, 'utf8', (err, data) => {
        if (err) return reject(err);
        try {
            return resolve(JSON.parse(data));
        } catch (e) {
            return reject(e);
        }
        });
    });
}

function autoUpdate() {
    login().then(() => {
        versions().then(vers => {
            vers.forEach(ver => {
                if(!saveData.vers[ver.id]) saveData.vers[ver.id] = {href:ver.href};
            });
            Object.keys(saveData.vers).forEach(ver => {
                if (saveData.vers[ver].dlLink !== null || fs.existsSync(`${process.env.APPDATA}/hades-cli/${ver}/`)) versionSelect.innerHTML = `${versionSelect.innerHTML}<div class="versionBtn" onclick="setVersion('${ver}')">${ver}</div>`;
            });
            setVersion(vers[0].id)
            writeJSON(`${process.env.APPDATA}/hades-cli/data.json`, saveData);
        });
    }).catch(()=> {
        alert("failed to log in");
    });
}

function setVersion(ver) {
    const oldVer = vernum.innerHTML;
    vernum.innerHTML = ver;
    versionSelect.style.maxHeight = "0px";
    arrow.style.transform = "rotate(0deg)";
    request({url:saveData.vers[ver].href, headers: {Cookie:loginCookie}}, (err, res, body) => {
        let http = new DOMParser().parseFromString(body, "text/html");
        changelogText.innerHTML = http.getElementsByClassName("bbWrapper")[0].innerHTML.split("href=").join("blocked=");
        try {
            saveData.vers[ver].dlLink = http.getElementsByClassName("attachment-icon")[0].getElementsByTagName("a")[0].href.replace(/file:\/\/\/[A-Z]:/, "https://hadesgta.com");
        } catch(e) {
            saveData.vers[ver].dlLink = null;
            if (!fs.existsSync(`${process.env.APPDATA}/hades-cli/${ver}/`)) {
                Array.from(document.getElementsByClassName("versionBtn")).forEach(e => {
                    if (e.innerHTML == ver) versionSelect.removeChild(e);
                });
                setVersion(oldVer);
            }
        }
        writeJSON(`${process.env.APPDATA}/hades-cli/data.json`, saveData);
    });
}

async function inject() {
    if (!fs.existsSync(`${process.env.APPDATA}/hades-cli/${vernum.innerHTML}/`) && !fs.existsSync(`${process.env.APPDATA}/hades-cli/${vernum.innerHTML}.zip`)) {
        await new Promise((resolve,reject) => {
            console.log("downloading...")
            if(!saveData.vers[vernum.innerHTML].dlLink) {
                alert("it appears this download link was removed, sorry.");
            } else {
                request.get({url:saveData.vers[vernum.innerHTML].dlLink, headers: {Cookie:loginCookie}}).on('close', () => {resolve()}).pipe(fs.createWriteStream(`${process.env.APPDATA}/hades-cli/${vernum.innerHTML}.zip`));
            }
        });
    }
    if (!fs.existsSync(`${process.env.APPDATA}/hades-cli/${vernum.innerHTML}/`) && fs.existsSync(`${process.env.APPDATA}/hades-cli/${vernum.innerHTML}.zip`)) {
        fs.mkdirSync(`${process.env.APPDATA}/hades-cli/${vernum.innerHTML}/`);
        let zip = new admzip(`${process.env.APPDATA}/hades-cli/${vernum.innerHTML}.zip`);
        zip.extractAllTo(`${process.env.APPDATA}/hades-cli/${vernum.innerHTML}/`, false);
    }
    await new Promise((resolve,reject) => {
        ncp(`${process.env.APPDATA}/hades-cli/${vernum.innerHTML}/Hades`, `${process.env.APPDATA}/Hades`,{clobber:false}, (err) => {
            console.log(err);
            resolve();
        });
    });
    fs.copyFileSync(`${process.env.APPDATA}/hades-cli/${vernum.innerHTML}/Hades/Hades CFG.ini`, `${process.env.APPDATA}/Hades/Hades CFG.ini`)
    fs.copyFileSync(`${process.env.APPDATA}/hades-cli/${vernum.innerHTML}/Hades/Hades.ytd`, `${process.env.APPDATA}/Hades/Hades.ytd`)
    fs.writeFileSync(`${process.env.APPDATA}/Hades/Hades CFG.ini`, fs.readFileSync(`${process.env.APPDATA}/Hades/Hades CFG.ini`, 'utf8').replace("YOUR USERNAME", saveData.login).replace("YOUR PASSWORD", saveData.password), 'utf8');
    exec(`"${process.cwd()}/resources/injector/core.exe" -n GTA5.exe -i "${process.env.APPDATA}/hades-cli/${vernum.innerHTML}/Hades.dll"`, (err,stdout,stderr)=>{
        if (!stdout.toLowerCase().includes("error")) {
            success.style.display = null;
            setTimeout(()=>{
                success.style.display = "none";
            }, 5000)
        } else {
            alert(stdout);
        }
    });
}

function showVers() {
    if (versionSelect.style.maxHeight == "0px") {
        versionSelect.style.maxHeight = "300px";
        arrow.style.transform = "rotate(180deg)";
    } else {
        versionSelect.style.maxHeight = "0px";
        arrow.style.transform = "rotate(0deg)";
    }
}


loginButton.addEventListener("click", autoUpdate);
version.addEventListener("click", showVers);
play.addEventListener("click", inject);

//init
if (!fs.existsSync(`${process.env.APPDATA}/hades-cli/`)) {
    fs.mkdirSync(`${process.env.APPDATA}/hades-cli/`);
}
if (fs.existsSync(`${process.env.APPDATA}/hades-cli/data.json`)) {
    openJSON(`${process.env.APPDATA}/hades-cli/data.json`).then(f => {
        loginField.value = f.login;
        passwordField.value = f.password;
        saveData = f;
        autoUpdate()
    });
}