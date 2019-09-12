import '../styles/main.scss';

// ============================================================
// ESTADO GLOBAL
// ============================================================

const estado = {
    cantidadProcesos: 0,
    cantidadRecursos: 0,
    caminoSeguro: [],
}

// Permite ver la variable "estado" en la consola del navegador
window.estado = estado;

// ============================================================
// SELECTORES
// ============================================================

const matricesIniciales = ['maxima', 'asignacion', 'recursos'];
const matricesCalculables = ['necesidad', 'disponibilidad'];
const initForm = document.querySelector('#init');
const initBtn = initForm.querySelector('.btn');
const resetBtn = document.querySelector('.btn--reset');
const matricesInicialesForm = document.querySelector('.matrices-iniciales');
const matricesCalculablesForm = document.querySelector('.matrices-calculables');
const inputProcesos = document.querySelector('#procesos');
const inputRecursos = document.querySelector('#recursos');
const caminoSeguro = document.querySelector('.camino-seguro');
const caminoSeguroSpan = caminoSeguro.querySelector('span');

// ============================================================
// EVENT LISTENERS
// ============================================================

// Cargar los event listeners una vez que la página esté cargada
window.addEventListener('load', cargarEventListeners);

function cargarEventListeners() {
    initForm.addEventListener('submit', inicializarMatrices, { once: true });
    matricesInicialesForm.addEventListener('submit', calcularMatrices, { once: true });
    matricesCalculablesForm.addEventListener('submit', calcularCaminoSeguro);
    resetBtn.addEventListener('click', location.reload.bind(location));
}

// ============================================================
// HANDLERS DE LOS EVENT LISTENERS
// ============================================================

function inicializarMatrices(event) {
    event.preventDefault();

    matricesInicialesForm.classList.remove('hidden');

    // Guardar cantidad de procesos y recursos ingresados en el objeto estado
    estado.cantidadProcesos = parseInt(inputProcesos.value);
    estado.cantidadRecursos = parseInt(inputRecursos.value);

    // Mostrar matrices iniciales
    for (let matriz of matricesIniciales) {
        mostrarMatriz(estado.cantidadProcesos, estado.cantidadRecursos, matriz, matricesInicialesForm);
    }

    // Insertar botón para Calcular las "Matrices Calculables"
    const btnCalc = '<button type="submit" class="btn">Calcular matrices</button>';
    matricesInicialesForm.insertAdjacentHTML('beforeend', btnCalc);
    
    // No permitir el ingreso de nuevos valores una vez clickeado el botón "Generar matrices iniciales"
    inputProcesos.setAttribute('disabled', '');
    inputRecursos.setAttribute('disabled', '');
    initBtn.setAttribute('disabled', '');
};

function calcularMatrices(event) {
    event.preventDefault();

    matricesCalculablesForm.classList.remove('hidden');
    caminoSeguro.classList.remove('hidden');

    // Mostrar matrices calculables
    for (let matriz of matricesCalculables) {
        mostrarMatriz(estado.cantidadProcesos, estado.cantidadRecursos, matriz, matricesCalculablesForm);
    }

    // Seleccionar los inputs de todas las matrices
    const inputsMaxima = Array.from(matricesInicialesForm.querySelectorAll('#maxima input'));
    const inputsAsignacion = Array.from(matricesInicialesForm.querySelectorAll('#asignacion input'));
    const inputsRecursos = Array.from(matricesInicialesForm.querySelectorAll('#recursos input'));
    const inputsNecesidad = Array.from(matricesCalculablesForm.querySelectorAll('#necesidad input'));
    const inputsDisponibilidad = Array.from(matricesCalculablesForm.querySelectorAll('#disponibilidad input'));

    // Obtener valores enteros de la matriz de recursos
    const valoresRecursos = mapearValoresEnteros(inputsRecursos);

    // Valores matriz de Necesidad = valores matriz máxima - valores matriz de asignación
    const valoresNecesidad = restarMatrices('maxima', 'asignacion');

    // Sumar cada columna de la matriz de asignación
    const sumaColumnasAsignacion = sumarColumnas('asignacion');

    // Ingresar en la matriz de Necesidad los valores calculados (valoresNecesidad)
    inputsNecesidad.forEach((elem, index) => {
        elem.value = valoresNecesidad[index];
    });

    // Los valores a ingresar en la matriz de Disponibilidad corresponden a la RESTA entre:
    // 1. Valor del recurso Rn en la matriz de Recursos
    // 2. Sumatoria de la columna correspondiente al recurso Rn en la matriz de Asignación
    inputsDisponibilidad.forEach((elem, index) => {
        elem.value = valoresRecursos[index] - sumaColumnasAsignacion[index];
    });    

    // Insertar botón para calcular el "Camino Seguro"
    const btnCamino = '<button type="submit" class="btn">Calcular camino seguro</button>';
    matricesCalculablesForm.insertAdjacentHTML('beforeend', btnCamino);

    // Deshabilitar boton para calcular matrices
    const btnCalc = matricesInicialesForm.querySelector('.btn');
    btnCalc.setAttribute('disabled', '');

    // Deshabilitar inputs para calcular matrices
    const inputsMatricesIniciales = [...inputsMaxima, ...inputsAsignacion, ...inputsRecursos];
    inputsMatricesIniciales.forEach(input => {
        input.setAttribute('disabled', '');
    });
};

function calcularCaminoSeguro(event) {
    event.preventDefault();

    const inputsDisponibilidad = Array.from(matricesCalculablesForm.querySelectorAll('#disponibilidad input'));
    const valoresDisponibilidad = mapearValoresEnteros(inputsDisponibilidad);
    const caminoSeguroBtn = matricesCalculablesForm.querySelector('.btn');

    for (let i = 0; i < estado.cantidadProcesos; i++) {
        if (estado.caminoSeguro.includes(i)) {
            // Si el proceso Pi ya fue ejecutado...
            // Continuar con la próxima iteración (próxima fila o proceso)
            continue;
        }

        // Seleccionar los inputs de la fila i de la matriz de Necesidad y obtener los valores enteros
        const inputsNecesidad = Array.from(document.querySelectorAll(`#necesidad td[data-fil="${i}"] input`));
        const valoresNecesidad = mapearValoresEnteros(inputsNecesidad);

        // Seleccionar los inputs de la fila i de la matriz Máxima y obtener los valores enteros
        const inputsMaxima = Array.from(document.querySelectorAll(`#maxima td[data-fil="${i}"] input`));
        const valoresMaxima = mapearValoresEnteros(inputsMaxima);

        // Un proceso PUEDE ejecutarse si, PARA TODOS los Recursos en una misma fila (Proceso), se cumple:
        // Valor del recurso en matriz de Necesidad <= Valor del recurso en matriz de Disponibilidad
        const procesoEjecutable = valoresDisponibilidad.every((elem, index) => {
            // return valoresNecesidad[index] <= valoresDisponibilidad[index];
            return valoresNecesidad[index] <= elem;
        });

        if (procesoEjecutable) {
            // Si el proceso es ejecutable, agregarlo al array "caminoSeguro"
            estado.caminoSeguro.push(i);

            // 1. Ejecución del proceso: se asignan los recursos necesarios al proceso
            // Disponibilidad (V) = Disponibilidad (V) - Necesidad del Proceso i (fila i, matriz C-A)
            // 2. Liberación de recursos: el proceso termina de ejecutar y libera los recursos que utilizó
            // Disponibilidad (V) = Disponibilidad (V) + Máxima del proceso i (fila i, matriz C)
            inputsDisponibilidad.forEach((elem, index) => {
                elem.value = elem.value - valoresNecesidad[index] + valoresMaxima[index];
            });

            // Si ya ejecuté todos los procesos...
            if (estado.caminoSeguro.length === estado.cantidadProcesos) {
                matricesCalculablesForm.removeEventListener('submit', calcularCaminoSeguro);
                caminoSeguroBtn.setAttribute('disabled', '');
            }

            mostrarCaminoSeguro(true);

            // Retornar de la función
            // Esto implica que se ejecutará el primer proceso ejecutable que se encuentre,
            // pudiendo haber otros que también estén en condiciones de ejecutarse
            return;
        }
    }

    // Si evalué todos los procesos y ninguno puede ejecutar, no hay camino seguro
    matricesCalculablesForm.removeEventListener('submit', calcularCaminoSeguro);
    caminoSeguroBtn.setAttribute('disabled', '');
    mostrarCaminoSeguro(false);
};

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function esVectorFila(matriz) {
    return matriz === 'recursos' || matriz === 'disponibilidad';
}

function construirMatriz(cantidadProcesos, cantidadRecursos, matriz) {
    const cantidadFilas = esVectorFila(matriz) ? 2 : cantidadProcesos + 1;
    const cantidadColumnas = cantidadRecursos + 1;
    const filas = Array(cantidadFilas).fill();
    const columnas = Array(cantidadColumnas).fill();

    const markup = `
        <div class="matriz-container">
            <h2 class="heading-2">Matriz de ${matriz}</h2>
            <table id="${matriz}" class="matriz">
                ${filas.map((itemFil, i) => {
                    return `
                        <tr>
                            ${columnas.map((itemCol, j) => {
                                return completarCeldas(i, j, matriz);
                            }).join('')}
                        </tr>
                    `
                }).join('')}
            </table>
        </div>
    `;
    
    return markup;
}

function completarCeldas(i, j, matriz) {
    if (i === 0 && j === 0) {
        return `
            ${esVectorFila(matriz) ? '' : '<th class="matriz__header">-</th>'}
        `;
    } else if (i === 0 && j !== 0) {
        return `
            <th class="matriz__header">
                R${j}
            </th>
        `;
    } else if (i !== 0 && j === 0) {
        return `
            ${esVectorFila(matriz) ? '' : `<th class="matriz__header">P${i}</th>`}
        `;
    } else {
        return `
            <td data-fil="${i - 1}" data-col="${j - 1}" class="matriz__celda">
                ${matricesCalculables.includes(matriz)
                    ? '<input type="number" min="0" disabled class="matriz__input" />'
                    : '<input type="number" value="0" min="0" class="matriz__input" />'
                }
            </td>
        `;
    }
}

// Insertar matriz como contenido de un elemento
function insertarMatriz(elemento, markup) {
    elemento.innerHTML += markup;
}

function mostrarMatriz(filas, columnas, matriz, elemento) {
    const markup = construirMatriz(filas, columnas, matriz);
    insertarMatriz(elemento, markup);
}

// Convierte un array de strings en un array numérico
// Ejemplo: ["0", "1", "2"] -> [0, 1, 2]
function mapearValoresEnteros(array) {
    return array.map(elem => parseInt(elem.value));
}

// Restar 2 matrices
function restarMatrices(a, b) {
    const inputsA = Array.from(document.querySelectorAll(`#${a} input`));
    const inputsB = Array.from(document.querySelectorAll(`#${b} input`));

    const valoresA = mapearValoresEnteros(inputsA);
    const valoresB = mapearValoresEnteros(inputsB);

    const resultado = valoresA.map((elem, index) => {
        return elem - valoresB[index];
    });

    return resultado;
}

// Sumar columnas de una matriz
function sumarColumnas(matriz) {
    let sumaColumnas = [];

    for (let i = 0; i < estado.cantidadRecursos; i++) {
        const inputsColumna = Array.from(document.querySelectorAll(`#${matriz} td[data-col="${i}"] input`));
        const valoresColumna = mapearValoresEnteros(inputsColumna);

        const sumaColumna = valoresColumna.reduce((acum, actual) => {
            return acum + actual;
        }, 0);

        sumaColumnas.push(sumaColumna);
    }

    return sumaColumnas;
}

// Si hay camino seguro, mostrar cuáles son los procesos que lo componen
// Si no hay camino seguro, mostrar "No hay camino seguro"
function mostrarCaminoSeguro(bool) {
    const procesos = estado.caminoSeguro;
    const markup = (!bool) ? 'No hay camino seguro' : procesos.map(elem => `P${elem + 1}`);
    caminoSeguroSpan.innerHTML = markup;
};