/* 
 * Access to the database via socketio 
 *  attempts to model the actual schema as well as possible
 *  usable for both ca,student views 
 */
var db = ["$rootScope","$http","$route",function ($rootScope,$http,$route) {
	var d = {};

	/* Access to user object */
	$rootScope.check_login = function () {
		//Get login user object
		$http.get('/user', {}).then(function (data) {
			if (data["data"]["first_name"] != undefined) {
				$rootScope.user = data["data"];
				window.location = "/#/" + $rootScope.user["role"]
			} 
		}, function() {
			if ($route.current.scope.name != "login") {
				window.location = "/#/"; 
			}
		});
	};

	/* Connect to socketio when the user exists */
	$rootScope.$watch(function () {
		return $rootScope.user;
	}, function (new_val,old_val) {
		if (old_val == undefined && new_val != undefined)  {
			/* Initialize SocketIO */
			d.sio = io('/queue');
			d.sio.on("connect", function() {
        setEmptyModel();
				d.io_connected = true;
				$rootScope.$apply();
			});
			d.sio.on("disconnect", function () {
				d.io_connected = false;
				$rootScope.$apply();
			})
			d.sio.on("questions",function (payload) { handle_db_update("questions",payload)})
			d.sio.on("locations",function (payload) { handle_db_update("locations",payload)})
			d.sio.on("topics",function (payload) { handle_db_update("topics",payload)})
			d.sio.on("ca_meta",function(payload) { handle_db_update("ca_meta",payload)});
			d.sio.on("queue_meta",function (payload) { handle_db_update("queue_meta",payload)})
			d.sio.on("current_question",function (payload) { handle_db_update("current_question",payload)})
			d.sio.on("users",function (payload) { handle_db_update("users",payload)})
			d.sio.on("message", function (payload) { Materialize.toast(payload) })
		}
	});

	d.io_connected = false

	/* Initialize Model of the database */
  var setEmptyModel = function() {
    d.model = {
      "questions":[],
      "topics":[],
      "locations":[],
      "ca_meta": [],
      "queue_meta": [],
      "current_question": [],
      "users": [],
    };
  };
  setEmptyModel();

	var handle_db_update = function(db_name,event) {
		var event_type = event["type"];
		var payload = event["payload"];
		console.log(event_type,payload,db_name)
		switch (event_type) {
			case "data": 
				for (var i = 0; i < payload.length; i++) {
					var db_index = get_index_by_id(d.model[db_name],payload[i].id)
					if (db_index == -1) {
						//Insert
						d.model[db_name].push(payload[i])
						continue
					}
					//Update
					d.model[db_name][db_index] = Object.assign(d.model[db_name][db_index],payload[i]);
				}
				break;
			case "delete": 
				for (var i = 0; i < payload.length; i++) {
					var qid = payload[i]
					var db_index = get_index_by_id(d.model[db_name],qid)
					if (db_index > -1) {
					  d.model[db_name].splice(db_index,1);
					}
				}
				break;
		}
		$rootScope.$apply();
	};
	
	/* Events to send */
	d.add_question = function(payload) {
		console.log(payload)
		d.sio.emit("new_question",payload)
	}
	d.delete_question = function() { 
		console.log("delete")
		d.sio.emit("delete_question", {})
	}
	d.freeze_question = function() {
		console.log("db freeze")
		d.sio.emit("freeze_question", {})
	}
	d.unfreeze_question = function() {
		console.log("db un freeze")
		d.sio.emit("unfreeze_question", {})
	}
	d.update_question = function(payload) {
		console.log(payload)
		d.sio.emit("update_question",payload)
	}
	d.close_queue = function() {
		console.log("close_queue")
		d.sio.emit('close_queue')
	}
	d.open_queue = function() {
		console.log("open_queue")
		d.sio.emit("open_queue")
	}
	d.update_minute_rule = function(new_rule) {
		console.log("update min")
		//Assumes server side validation, send "message" event if invalid
		d.sio.emit("update_minute_rule",new_rule);
	}
	d.kick_question = function() {
		console.log("db kick")
		d.sio.emit("kick_question",{});
	}
	d.finish_question = function() {
		console.log("db finish")
		d.sio.emit("finish_question",{});
	}
	d.answer_question = function () {
		console.log("Answer!")
		d.sio.emit("answer_question",{})
	}
	d.go_online = function () {
		console.log("go online")
		d.sio.emit("go_online")
	}
	d.go_offline = function () {
		console.log("go offline")
		d.sio.emit("go_offline")
	}


	/* Helpers */
	d.get_field_by_id = function(fields,name,id) {
		for (var i = 0; i < fields.length; i++) {
			if (fields[i].id == id) {
				return fields[i][name]
			}
		}	
		return ""	
	}
	d.get_topic_by_id = function(id) { return d.get_field_by_id(d.model["topics"],"topic",id)}
	d.get_location_by_id = function(id) { return d.get_field_by_id(d.model["locations"],"location",id) }
	d.can_freeze = function () {
		if (d.model["questions"].length == 0) {
			return false
		}
		return d.model["questions"][0].can_freeze
	}
	d.is_frozen = function () {
		if (d.model["questions"].length == 0) {
			return false	
		}
		return d.model["questions"][0].is_frozen
	}

	return d 
}];