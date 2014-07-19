/**
 * Este modulo es el encargado de mantener la programacion de las tareas que se deben ejecutar en ttagit
 **/

var TtagitTaskScheduler = function(){
	this.tasks = [];
	this.defaultTime = '1';//1 minuto por defecto
	this.fractionTime = '60000';//fraccion cada 1 minuto
	this.task = null;
	this.stop = false;
	this.inEjecution = false;
	this.taskToRemove = null;
	this.taskToAdd = null;
	this.taskToAddTime = null;
	this.newRateTime = null;
	this.MinPercent = 22;//porcentaje de pedidos restantes sobre el total en el cual se comenzara a chequear el scheduler.
	this.plus = 0;
	this.executeInmediatly = true;
}

TtagitTaskScheduler.prototype = {

	/**
		*Este metodo agrega la funcion indicada en el arreglo de funciones para que la misma sea ejecutada en adelante segun el time indicado.
		*Ademas la ejecuta inmediatamente.
	*/
	add: function(task,time,fixedTime){
		var newTask, auxTime;

		//no agregar duplicados
		if(this.exist(task)){ return false; }

		//si esta en ejecucion ??? y salir
		if(this.inEjecution){ 
			this.taskToAdd = task;
			this.taskToAddTime = time;
			return true;
		}

		// fix fixedTimr param
		if((typeof(fixedTime)=="undefined")||(!fixedTime)){
			fixedTime = "false";
		}else{
			fixedTime = "true";
		}

		//
		// add new task depending on time parameter
		//

		//es un valor incorrecto
		//es un string con los valores cero/default/null
		if ( (isNaN(time) && isNaN(parseInt(time)) ) || (isNaN(time) && ((time == '0') || (time == 'default') || (time == null)) ) ){
			newTask = [{"task":task,"time":ttagit.taskScheduler.defaultTime,"count":'0',"fixedTime":fixedTime}];
			ttagit.debug.showMessage("Se llamo a la funcion taskScheduler.add con time = "+time);
		}

		//es un string con una representacion numerica > 0
		else if (isNaN(time) && !isNaN( parseInt(time) ) ){
			newTask = [{"task":task,"time":time,"count":'0',"fixedTime":fixedTime}];
		}

		// es un numero valido
		else if (!isNaN(time)){
			auxTime = time.toString();
			if(auxTime == '0'){
				auxTime = ttagit.taskScheduler.defaultTime;
			}
			newTask = [{"task":task,"time":auxTime,"count":'0',"fixedTime":fixedTime}];
		}

		// no deberia pasar nunca
		else {
			newTask = [{"task":task,"time":ttagit.taskScheduler.defaultTime,"count":'0',"fixedTime":fixedTime}];
			ttagit.debug.showMessage("Se llamo a la funcion taskScheduler.add con time = "+time);
		}

		//se guarda y se ejecuta
		ttagit.taskScheduler.tasks = ttagit.taskScheduler.tasks.concat(newTask);
		if(this.executeInmediatly){
			ttagit.callback.execute(task);
		}else{
			this.executeInmediatly = true;
		}
		
	},

	setUniqueExecutionFunction: function(task,time_ms){
		setTimeout(function(){ttagit.callback.execute(task)},time_ms);
	},
	
	/**
		*Esta funcion recorre el arreglo de funciones cargadas y ejecuta aquellas funciones cuyos valores de time y count coinciden, e incrementa
		*el valor de count en aquellas funciones donde esto no sucede. Ademas al ejecutar una funcion setea a 0 el valor de count de la misma.
	*/
	execute: function(){
		var i,count;
	
		this.inEjecution = true;//se bloquea el arreglo de tareas

		for(i=0;i<ttagit.taskScheduler.tasks.length;i++){
			count = parseInt(ttagit.taskScheduler.tasks[i].count) + 1;
			ttagit.taskScheduler.tasks[i].count = count.toString();
			if(ttagit.taskScheduler.tasks[i].time <= ttagit.taskScheduler.tasks[i].count){
				//Se utiliza setTimeout para poder seguir la ejecucion concurrente, si esto no fuera asi
				//el sistema deberia esperar que termine la ejecucion de una funcion para poder ejecutar otra
				ttagit.callback.execute(ttagit.taskScheduler.tasks[i].task);
				ttagit.taskScheduler.tasks[i].count = '0';
			}
		}

		this.inEjecution = false;//se desbloquea el arreglo de tareas para poder ser borrado.

		if(!this.stop){
			if(this.taskToRemove != null){//caso en el que se pidio eliminar una tarea mientras se ejecutaba el cron
				this.remove(this.taskToRemove);
				this.taskToRemove = null;
			}
			if(this.taskToAdd != null){//caso en el que se pidio agregar una tarea mientras se ejecutaba el cron
				this.add(this.taskToAdd,this.toAddTime);
				this.taskToAdd = null;
				this.toAddTime = null;
			}
			if(this.newRateTime !=null){
				this.setRateTime(this.newRateTime);
				this.newRateTime = null;
			}
			this.task = setTimeout(function(){ttagit.taskScheduler.execute()},ttagit.taskScheduler.fractionTime);
		}
	},

	/**
		*Este metodo hace que la proxima funcion a ser agregada al scheduler no se ejecute inmediatamente despues de agregarla. 
	*/
	notExecuteInmediatly: function(){
		this.executeInmediatly = false;
	},

	/**
		*Este metodo comienza la exejucion del modulo.
	*/
	init: function(){
		this.stop = false;
		this.tasks = [];//se borran las tareas para volver a comenzar la ejecucion desde cero.
		this.task = setTimeout(function(){ttagit.taskScheduler.execute()},ttagit.taskScheduler.fractionTime);
	},

	/**
		*Este metodo elimina la funcion indicada del arreglo de funciones para que la misma no vuelva a ejecutarse en adelante.
	*/
	remove: function(task){

		var pos = this.exist(task);

		if(!pos) { return false; }

		if(this.inEjecution){
			this.taskToRemove = task;
			return true;
		}

		ttagit.taskScheduler.tasks.splice(pos,1);
		/*
		alert(ttagit.debug.jsonToString(task));
		this.seeTheTask();
		*/
		return true;
	},

	/**
		*Este metodo si la tarea ya se encuentra cargada en el scheduler retorna true y false en caso contrario.
	*/
	exist: function(task){
		var i;
		for(i=0;i<ttagit.taskScheduler.tasks.length;i++){
			if(ttagit.debug.jsonToString(ttagit.taskScheduler.tasks[i].task) == ttagit.debug.jsonToString(task)){
				return i;
			}
		}
		return false;
	},

	/**
	 * para el scheduler
	 */
	finish: function(){

		if(this.inEjecution){
			this.stop = true;
			return true;
		}

		clearTimeout(this.task);
	},

	/**
	 *Cambia el tiempo de las tareas del scheduler. 
	 */
	setRateTime: function(newTime){
		var count,time,newCount;

		//falta campo
		if((typeof(newTime)=="undefined")||(newTime == null)){ 
			ttagit.message.set('error','105',['newTime is not valid.','missing parameter \'newTime\' in function taskScheduler.setRateTime']);
			return false;
		}

		//si esta en ejecucion lo hago despues
		if(this.inEjecution){
			this.newRateTime = newtime; 
			return true;
		}

		for(i=0;i<ttagit.taskScheduler.tasks.length;i++){
			if(ttagit.taskScheduler.tasks[i].fixedTime != "false"){ continue; }

			count = parseInt(ttagit.taskScheduler.tasks[i].count);
			time = parseInt(ttagit.taskScheduler.tasks[i].time);

			if(isNaN(newTime)){
				ttagit.taskScheduler.tasks[i].time = newTime;//asigno el nuevo tiempo a la tarea.
				newTime = parseInt(newTime);//luego de asignarlo lo convierto en entero para hacer las comparaciones.
			}else{
				ttagit.taskScheduler.tasks[i].time = newTime.toString();//Convierto el tiempo a string y lo asigno  a la tarea.
			}

			//menor rate de refresco
			//si al sacarle tiempo entonces ya se deberia haber ejecutado, entonces hago que se ejecute en la proxima iteracion.
			if(time > newTime && count >= newTime){
				newCount = newTime -1;
				ttagit.taskScheduler.tasks[i].count = newCount.toString();
			}

		}
	},

	//Solo debe usarse para controlar las tareas que se estan ejecutando.
	seeTheTask: function(){
		var tareas = "";
		for(i=0;i<ttagit.taskScheduler.tasks.length;i++){
			tareas += ", "+ttagit.taskScheduler.tasks[i].task.f1+" with time -->"+ttagit.taskScheduler.tasks[i].time;
		}
		alert(tareas);
	},

}
