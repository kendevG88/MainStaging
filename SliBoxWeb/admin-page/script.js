
import cmd from "../cmd.js";
import dateTime from "../dateTime.js";
const serverDomain = "matchchatvn.onrender.com";

let loginToken = ''

let notifyConfirmCallBack;
let verifyConfirmCallBack;
let verifyCancelCallBack;

let notifyContent = document.getElementById('notify-content');
let verifyContent = document.getElementById('verify-content');

setActiveClass('login-container', true);
setActiveClass('admin-controller', false);
setActiveClass('option-button', false);

function notifyPopupConfirm(){
    if(notifyConfirmCallBack) notifyConfirmCallBack();
    notifyConfirmCallBack = null;
    setActiveClass('notify-popup', false)
}

function verifyPopupConfirm(){
    if(verifyConfirmCallBack) verifyConfirmCallBack();
    verifyConfirmCallBack = null;
    setActiveClass('verify-popup', false)
}

function verifyPopupCancel(){
    if(verifyCancelCallBack) verifyCancelCallBack();
    verifyCancelCallBack = null;
    setActiveClass('verify-popup', false)
}

function showNotifyPopup(mess, notifyCallBack = null){
    notifyContent.textContent = mess;
    notifyConfirmCallBack = notifyCallBack;
    setActiveClass('notify-popup', true)
}

function showVerifyPopup(mess, verifyCallBack, cancelCallBack = null){
    verifyContent.textContent = mess;
    verifyConfirmCallBack = verifyCallBack;
    verifyCancelCallBack = cancelCallBack;
    console.log('show verify')
    setActiveClass('verify-popup', true);
}

function setActiveClass(className, active) {
    let elements = document.getElementsByClassName(className);
    if (elements) {
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.display = active ? 'block' : 'none';
        }

    }
    else console.log('elements ' + className + " is not found.")
}

function setActiveTag(index) {
    for (let i = 0; i < 4; i++) {
        if (i == index) {
            setActiveClass('tag' + i, true);
        }
        else setActiveClass('tag' + i, false);
    }
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    console.log('login ')
    // Dummy check for username and password
    if (username && password) {
        let mess = {
            cmd: cmd.login.LOGIN,
            un: username,
            pw: password
        }

        sendMessageToServer(mess, (data) => {
            if (data.cmd == cmd.login.LOGIN_COMPLETED) {
                loginToken = data.mess.token
                onLoginCompleted();
            }
            else if (data.cmd == cmd.login.LOGIN_FAILED) {
                showNotifyPopup(data.mess);
            }
            else {
                showNotifyPopup('Login error!');
            }
            //alert('received mess from server ' + JSON.stringify(data))
        });

    } else {
        showNotifyPopup('Invalid Credentials!');
    }
}

function sendNotification() {
    const message = document.getElementById('notify-input').value;
    if(message == ''){
        showNotifyPopup('Chưa nhập tin nhắn thông báo.');
    }
    else{
        showVerifyPopup('Có muốn gửi tin nhắn thông báo tới tất cả người dùng không?',()=>{
            sendMessageToServer({
                cmd: cmd.notify.GLOBAL,
                mess: message
            },
            (data) => {
                showNotifyPopup(data.mess);
            })
        })
    }
    
    // Dummy function to simulate sending a notification
}

function onLoginCompleted() {
    setActiveClass('login-container', false);
    setActiveClass('admin-controller', true);
    setActiveClass('option-button', true);
    setActiveTag(0);
}

function sendLogOutMess() {
    let mess = {
        cmd: cmd.login.LOGOUT,
        mess: {}
    }
    sendMessageToServer(mess, logOut);
}

function logOut() {
    loginToken = '';

    setActiveClass('login-container', true);
    setActiveClass('admin-controller', false);
    setActiveClass('option-button', false);
}
function sendMessageToServer(message, callBack = null) {
    message.token = loginToken;
    fetch(serverDomain+'/send-message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message })  // Đảm bảo rằng bạn gửi một đối tượng
    })
        .then(response => response.text())  // Trước tiên đọc phản hồi như văn bản
        .then(text => {
            try{
                return JSON.parse(text);
            }
            catch(ex){
                console.log('received mess: ' + text)
                return {}
            }
              // Sau đó phân tích cú pháp JSON
        })
        .then(data => {
            console.log(JSON.stringify(data))
            if (data.cmd == cmd.login.LOGOUT) {
                logOut();
            }
            else callBack(data);
        })
        .catch(error => console.error('Error:', error));
}

function sendSetupChatBot(){
    let mess = {
        cmd : cmd.setupProfile.SETUP,
        mess : {}
    }

    sendMessageToServer(mess, (data) => {

    })
}





function downloadTextFild(text, filename = 'data.json') {

    // Tạo một blob từ chuỗi JSON
    const blob = new Blob([text], { type: 'application/json' });

    // Tạo một liên kết và thiết lập các thuộc tính cho việc tải xuống
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    // Thêm liên kết vào trang và kích hoạt tải xuống
    document.body.appendChild(a);
    a.click();

    // Xóa liên kết khỏi trang
    document.body.removeChild(a);

    // Giải phóng URL object
    URL.revokeObjectURL(url);
}

function downLoadData() {
    let mess = {
        cmd : cmd.data.WRITE,
    }
    showVerifyPopup('Có muốn tải data từ server không?' ,() => {
        sendMessageToServer(mess, (data)=> {
            console.log(data.mess);
            downloadTextFild( JSON.stringify(data.mess), dateTime.getCurrentTimeInGMT7() + '-MatchChat-Data.json');
        })
    })
    
}

function upLoadData() {

    const input = document.getElementById('json-data-file-input');
    const file = input.files[0]; // Lấy tệp đầu tiên đã chọn
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                let text = event.target.result;
                let mess = {
                    cmd : cmd.data.READ,
                    mess: text
                }
                showVerifyPopup('Có muốn tải data lên server không?', () => {
                    sendMessageToServer(mess, (data) => {showNotifyPopup(data.mess)});
                })
            } catch (error) {
                showNotifyPopup('Error parsing JSON!\n' + error);
            }
        };
        reader.onerror = function() {
            console.error('Error reading the file');
        };
        reader.readAsText(file); // Đọc tệp như là một chuỗi văn bản
    } else {
        showNotifyPopup('File Data JSON chưa được chọn.');
    }
}



window.Script = {
    login,
    sendLogOutMess,
    setActiveClass,
    setActiveTag,
    downLoadData,
    upLoadData,
    sendNotification,
    notifyPopupConfirm,
    verifyPopupConfirm,
    verifyPopupCancel,
    sendSetupChatBot
}