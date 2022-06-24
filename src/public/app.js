const video = document.createElement("video");
const canvasElement = document.getElementById("canvas");
const canvas = canvasElement.getContext("2d");
const loadingMessage = document.getElementById("loadingMessage");
const outputContainer = document.getElementById("output");
const outputMessage = document.getElementById("outputMessage");

let ANDROID = false;
let IOS = false;
let listo = true;

$('.loader-container').hide();

function drawLine(begin, end, color) {
    canvas.beginPath();
    canvas.moveTo(begin.x, begin.y);
    canvas.lineTo(end.x, end.y);
    canvas.lineWidth = 4;
    canvas.strokeStyle = color;
    canvas.stroke();
}

const htmlSelect = (option) => {
    let html = '';
    const tipos = tiposTrabajo.find(t => t.tipo==option).opcs;
    for (let i of tipos) {
        html += `   <option value="${i.nombre}">${i.nombre}</option>`;
    }
    return html;
}

// Use facingMode: environment to attemt to get the front camera on phones
navigator.mediaDevices.getUserMedia({
    video: { 
        facingMode: "environment"
    } 
})
.then((stream) => {
    video.srcObject = stream;
    video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
    video.play();
    requestAnimationFrame(tick);
},  err => console.log(err));


function tick() {
    try {
        loadingMessage.innerText = "⌛ Cargando Imagen..."
        outputMessage.innerText = "⌛ Cargando Imagen..."
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            loadingMessage.innerText = "⌛ Analizando QR y Registrando Paquete..."        
            outputMessage.innerText = "⌛ Analizando QR y Registrando Paquete..."        
            canvasElement.hidden = false;
            outputContainer.hidden = false;

            //canvasElement.height =  video.videoHeight;
            canvasElement.height =  $(window).height() * 0.7;
            canvasElement.width = video.videoWidth;
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            if (code && listo) {
                listo = false;
                const dataQr = JSON.parse(code.data);
                if (dataQr.id != undefined && dataQr.id != null && dataQr.id != '' && dataQr.sender_id != undefined && dataQr.sender_id != null && dataQr.sender_id != '') {
                    $('.loader-container').show();
                    const canvas = document.getElementById('canvas');
                    const img = canvas.toDataURL();
                    const data = {data: dataQr}
                    drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
                    drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
                    drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
                    drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
                    let url = '';
                    let ruta = window.location.pathname;
                    ruta = ruta.split('/');
                    if (ruta[1]=='') {
                        url = '/subir';
                        data.img = img;
                        data.entrega = $('#tipos').val();
                    } else if (ruta[1]=='repa') {
                        if ($('#nomrepa').text()=='') {
                            swal('Error con el Repartidor', 'Ingresà un Código Válido.', {
                                icon: "error",
								showConfirmButton: false,
								timer: 1500 // es ms (mili-segundos)
                            });
                            $('.loader-container').hide();
                            return;
                        }
                        url = `/enreparto/${ruta[2]}?repa=${$('#repa').val()}`;
                    }
                    $.ajax({
                        url : url,
                        data : data,
                        method : 'POST', //en este caso
                        dataType : 'json',
                        success : function(response){
                            if (response.ok == 1) {
                                swal(response.rsdo, {
                                    icon: "success",
									showConfirmButton: false,
									timer: 1500 // es ms (mili-segundos)
                                });
                            } else {
                                swal('Error al Registrar', response.rsdo, {
                                    icon: "error",
									showConfirmButton: false,
									timer: 1500 // es ms (mili-segundos)
                                });
                            }
                            loadingMessage.innerText = 'Buscando Código QR...';
                            outputMessage.innerText = 'Buscando Código QR...';
                        },
                        error: function(error){
                            swal('Error al Registrar', error.message, {
                                icon: "error",
								showConfirmButton: false,
								timer: 1500 // es ms (mili-segundos)
                            });
                            loadingMessage.innerText = 'Buscando Código QR...';
                            outputMessage.innerText = 'Buscando Código QR...';
                        },
                        complete: () => {
                            $('.loader-container').hide();
                        }
                    });
                }
                setTimeout(() => {
                    listo = true;    
                },3000);     
            } else {
                loadingMessage.innerText = 'Buscando Código QR...';
                outputMessage.innerText = 'Buscando Código QR...';
            }
        }
    } catch (error) {
        console.error(error)
        setTimeout(() => {
            listo = true;
        },3000);    
    }
    requestAnimationFrame(tick);
}
document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
        let ruta = window.location.pathname;
        ruta = ruta.split('/');
        if (ruta[1]=='') {
            if (localStorage.getItem('Tipo')) {
                $('#tipos').val(localStorage.getItem('Tipo')).trigger("change");
            }
        } else if (ruta[1]=='repa') {
            if (localStorage.getItem('Repa')) {
                $('#repa').val(localStorage.getItem('Repa'))
                buscarRepartidor();
            }
            document.getElementById("formRepa").addEventListener("submit", function(event){
                event.preventDefault()
            });
        }
    }
};

const cambioTipo = () => {
    localStorage.setItem('Tipo', $('#tipos').val());
}

const buscarRepartidor = () => {
    if ($('#repa').val()!='') {
        let url = `/repartidor?repa=${$('#repa').val()}` ;
        $.ajax({
            url : url,
            method : 'GET', //en este caso
            dataType : 'json',
            success : function(res){
                if (res.nombre!= '') {
                    $('#nomrepa').text(res.nombre);
                    localStorage.setItem('Repa', $('#repa').val())
                }
            },
            error: function(error){
                $('#nomrepa').text('');
            }
        });
    } else {
        $('#nomrepa').text('');
    }
}
