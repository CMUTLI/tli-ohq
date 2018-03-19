var admin_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.current_page = "admin";
	$rootScope.check_login();
	$scope.update_minute_rule = function () {
		var min_rule =  $("#minuteRule").val();
		if (isNaN(min_rule)) {
			Materialize.toast("Invalid minute rule!")
			return
		}
		$db.update_minute_rule(min_rule);
		Materialize.toast("Minute rule updated!",2000);
	}

	$scope.add_ca_andrew_id = function () {
		$http.post("/api/role/set", { "andrew_ids": [$("#new_ca_andrew_id").val()],
																	 "course_id": parseInt(sessionStorage.getItem('current_course')),
																	 "role": "ca"})
				 .then(function(success) {
					 		   $scope.get_tas();
					 			 Materialize.toast("TA added!",2000);
					 	   },
					 		 function(fail) {
					 			 Materialize.toast('There was an error', 5000);
					 	   });
	}

	$scope.selected_del = "Topic";
	$scope.selected_del_item = "unkown";
	$scope.selected_del_id = -1;
	$scope.select = function (del_item, del,del_id) {
		$scope.selected_del = del;
		$scope.selected_del_item = del_item;
		$scope.selected_del_id = del_id;
	}
	$scope.delete_topic_or_loc = function () {
		if ($scope.selected_del == "Topic"){
			$db.delete_topic($scope.selected_del_id);
		}
		if ($scope.selected_del == "Location") {
			$db.delete_loc($scope.selected_del_id);
		}
	}

	$scope.enable_topic_or_loc = function()  {
		if ($scope.selected_del == "Topic"){
			$db.enable_topic($scope.selected_del_id);
		}
		if ($scope.selected_del == "Location") {
			$db.enable_loc($scope.selected_del_id);
		}
	}

	$scope.submit_roles = function(people) {
			people = people.filter((person) => person != "");
			var payload = {
				"andrew_ids": people,
				"course_id": parseInt(sessionStorage.getItem('current_course')),
				"role": "ca"
			}
			$http.post("/api/role/set", payload).then(function(success) {
				$scope.get_tas();
				Materialize.toast('TAs Added', 5000);
			}, function(fail) {
				Materialize.toast('There was an error', 5000);
			});
	}

	$scope.batch_role = function () {
		var input, file, fr, result;
		input = document.getElementById('csv_input');
		file = input.files[0]
		fr = new FileReader();
		fr.onload = function(e) {
			$scope.submit_roles(e.target.result.split("\n"));
		}
		fr.readAsText(file);
	}

	$scope.get_tas = function () {
		$http.get("/api/course/get_tas",
							{params: {course_id: parseInt(sessionStorage.getItem('current_course'))}})
			.then(function(success) {
				$scope.tas = success.data;
	    },
			function(fail) {
				Materialize.toast('There was an error', 5000);
	    });
	}
	$scope.get_tas();

	$scope.selected_ta = "unknown";
	$scope.select_ta = function (andrew_id) {
		$scope.selected_ta = andrew_id;
	}

	$scope.delete_ta = function () {
		if ($scope.selected_ta == $rootScope.user.andrew_id) {
			Materialize.toast("You can't remove yourself from a course", 5000);
			return;
		}

		var payload = {
			andrew_ids: [$scope.selected_ta],
			course_id: parseInt(sessionStorage.getItem("current_course")),
			role: 'student'
		}

		$http.post("/api/role/set", payload).then(function(success) {
				$scope.get_tas();
	      Materialize.toast('TA Removed', 5000);
	    }, function(fail) {
	      Materialize.toast('There was an error', 5000);
	    });
	}

	// Stats

	$scope.find_bucket_size = function (L) {
		var max_found = 0;
		for(var row = 0; row < L.length; row++) {
			for(var col = 0; col < L[0].length; col++) {
				if(L[row][col] > max_found) max_found = L[row][col];
			}
		}
		return (max_found / 4) >> 0; // make bucket size an int in the worst way possible
	}

	$scope.colorize = function(raw) {
		// adds color to each element based on #
		// requires rectangular 2d list of ints

		// TODO: Variable bucket sizes?
		var res = [];
		for(var row = 0; row < raw.length; row++) {
			var temp = [];
			for(var col = 0; col < raw[0].length; col++) {
				if(raw[row][col] < $scope.bucket_size) temp.push("#FFFFFF");
				else if(raw[row][col] < 2 * $scope.bucket_size) temp.push("#F8AAAA");
				else if(raw[row][col] < 3 * $scope.bucket_size) temp.push("#F15555");
				else temp.push("#EB0000");
			}
			res.push(temp)
		}
		return res;
	} 


	$scope.get_weekly_heatmap = function() {
		// TODO: Replace with api call
		var raw = [[0, 5, 1, 3, 4, 5, 0], 
				  [3, 4, 0, 3, 3, 5, 5], 
				  [1, 5, 1, 0, 3, 2, 4], 
				  [2, 1, 2, 1, 0, 0, 1], 
				  [0, 2, 5, 5, 2, 4, 0], 
				  [1, 4, 3, 4, 3, 0, 1], 
				  [2, 0, 1, 4, 1, 0, 1], 
				  [5, 0, 2, 4, 5, 3, 0], 
				  [5, 1, 2, 3, 5, 1, 0], 
				  [2, 2, 0, 2, 1, 2, 2], 
				  [3, 1, 3, 0, 2, 4, 0], 
				  [5, 0, 0, 2, 5, 5, 3], 
				  [3, 4, 3, 5, 3, 4, 2], 
				  [3, 4, 0, 1, 5, 0, 1], 
				  [0, 4, 4, 5, 1, 0, 5], 
				  [0, 0, 0, 1, 1, 4, 5], 
				  [2, 0, 3, 2, 3, 1, 0], 
				  [0, 3, 3, 2, 0, 3, 3], 
				  [3, 3, 3, 4, 0, 2, 0], 
				  [5, 2, 3, 0, 4, 4, 4], 
				  [3, 5, 3, 5, 1, 1, 0], 
				  [0, 3, 5, 1, 1, 2, 2], 
				  [4, 5, 1, 3, 1, 2, 1], 
				  [0, 1, 2, 0, 5, 5, 0]];
		$scope.bucket_size = $scope.find_bucket_size(raw);
		$scope.heatmap = $scope.colorize(raw);
	}
	$scope.get_weekly_heatmap();
}];
