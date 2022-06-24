function formatoFecha(sfecha, hs, americana) {
    if (sfecha != undefined) {
		var fh;
        try {
            fh = new Date(sfecha.toString().replace(/\s/, 'T'));
            if (fh.toString()=="Invalid Date") {
                fh = sfecha;
            }
        } catch {
            fh = sfecha;
        }				
		var fhtxt = zfill(parseInt(fh.getDate()), 2) + '/' + zfill((parseInt(fh.getMonth()) + 1), 2) + "/" + parseInt(fh.getFullYear());
        if (americana){ fhtxt = fechaAmericana(fhtxt)}
        if (hs == 1) { fhtxt +=  ' ' + zfill(parseInt(fh.getHours()), 2) + ':' + zfill(parseInt(fh.getMinutes()), 2) };
        return fhtxt;
    } else {
        return '01/01/1900';   }
}


const fechaAmericana = (f) => {
	let ano = f.substring(6, 10) * 1;
	let mes = f.substring(3, 5) * 1;
	let dia = f.substring(0, 2) * 1;
	let fecha = zfill(ano, 4)+'-'+zfill(mes, 2)+'-'+zfill(dia, 2)
	return fecha;
}
function fechaValida(d) {
	if (Object.prototype.toString.call(d) === "[object Date]") {
		// it is a date
		if (isNaN(d.getTime())) {
		  return false
		} else {
		  return true
		}
	  } else {
		return false
	  }
}

const zfill = (number, width, deci) => {
    let numberOutput = Math.abs(number); /* Valor absoluto del n�mero */
    if (deci!=undefined|| deci>0) {
        numberOutput = Number.parseFloat(numberOutput).toFixed(deci).toString();
    }
    let length = numberOutput.toString().length; /* Largo del n�mero */
    let zero = "0"; /* String de cero */
    if (width <= length) {
        if (number < 0) {			
            return ("-" + numberOutput.toString());
        } else {
            return numberOutput.toString();
        }
    } else {
        if (number < 0) {
            return ("-" + (zero.repeat(width - length - 1)) + numberOutput.toString());
        } else {
            return zero.repeat(width - length) + numberOutput.toString();
        }
    }
}

