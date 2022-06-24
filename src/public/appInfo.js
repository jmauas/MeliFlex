
let ANDROID = false;
let IOS = false;
let listo = true;

$('.loader-container').hide();

const cambioInfo = () => {
    const fecha = $('#fecha').val();
    const repa = $('#repa').val();
    const tipo = $('#tipos').val();
    const es = $('#es').val();
    const se = $('#sinEntregar').prop("checked");
    let url = `/info?repa=${repa}&fecha=${fecha}&tipo=${tipo}&es=${es}&se=${se}`;
    window.location.href = url;
}

const generarQr = (json, nombre) => {
    const qr = new QRious({
        element: document.querySelector('#qr'),
        value: json, // La URL o el texto
        size: 300,
        padding: 15,
        mime: 'image/png',
        backgroundAlpha: 0, // 0 para fondo transparente
        foreground: '#000000', // Color del QR
        level: 'H', // Puede ser L,M,Q y H (L es el de menor nivel, H el mayor)
    });
    $('#nombreQr').text(nombre);
    $('#mostrarQr').modal('show');
}

const pedirEntrega = async (idEntrega) => {
    $('.loader-container').show();
    const respuesta = await fetch(`/consultaPaquete/${idEntrega}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const datos = await respuesta.json();
    console.log(datos.rsdo)
    let html = `
        <tr>
            <td>Estado</td>
            <td>${ estadosML(datos.rsdo.envio.status)} ${datos.rsdo.envio.status}</td>
        </tr>`;
        if (datos.rsdo.envio.substatus!=null) {
            html += `
            <tr>
                <td>Sub Estado</td>
                <td>${datos.rsdo.envio.substatus}</td>
            </tr>`;
        }
        if (datos.rsdo.envio.status_history.date_first_visit!=null) {
            let fh = datos.rsdo.envio.status_history.date_first_visit;
            fh = new Date(fh);
            fh.setHours(fh.getHours()+1);
            fh = formatoFecha(fh, 1, false)
            html += `
            <tr>
                <td>Visita</td>
                <td>${fh}</td>
            </tr>`;
        }
        html += `
        <tr>
            <td>Domicilio</td>
            <td>${datos.rsdo.envio.receiver_address.address_line}</td>
        </tr>
        <tr>
            <td>Localidad</td>
            <td>
                ${datos.rsdo.envio.receiver_address.state.name} 
                ${datos.rsdo.envio.receiver_address.city.name} 
                ${datos.rsdo.envio.receiver_address.state.name} 
                ${datos.rsdo.envio.receiver_address.zip_code}
            </td>
        </tr>
        <tr>
            <td>Comentarios</td>
            <td>
                ${datos.rsdo.envio.receiver_address.comment} 
            </td>
        </tr>`
        if (datos.rsdo.envio.date_first_printed!=null) {
            let fh = datos.rsdo.envio.date_first_printed;
            fh = new Date(fh);
            fh.setHours(fh.getHours()+1);
            fh = formatoFecha(fh, 1, false)
            html += `
            <tr>
                <td>Etiqueta Impresa</td>
                <td>${fh}</td>
            </tr>`;
        }
        html += `
        <tr>
            <td>Nombre</td>
            <td>${datos.rsdo.envio.receiver_address.receiver_name}</td>
        </tr>
        <tr>
            <td>Telefono</td>
            <td>${datos.rsdo.envio.receiver_address.receiver_phone}</td>
        </tr>
    `;
    html = html.replaceAll('null', '');
    $('#detallePaquete').html(html);
    $('#mostrarDatos').modal('show');
    $('.loader-container').hide();
}

const estadosML = (es) => {
    switch (es) {  
        case 'pending':
            return 'Sin Asignar'
        case 'ready_to_ship':
            return 'Sin Asignar'
        case 'handling':
            return 'En Camino'
        case 'shipped':
            return 'En Camino'
        case 'delivered':
            return 'Entregado'
        case 'not_delivered':
            return 'Sin Asignar'
        case 'cancelled':
            return 'Entregado'
        default:
            return 'Sin Asignar'
    }
}

