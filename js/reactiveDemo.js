var imdb = angular.module('imdb', []);

imdb.controller('imdbcontroller', ['$scope', '$http', function($scope, $http) {
	$scope.result = null;
	$scope.tmdbMovies = [];
	var Observable = Rx.Observable;
	var movieSearch = document.getElementById('movieSearch');
	var movieSearchKeypresses = Observable.fromEvent(movieSearch, 'keyup');
	var movieIds= [];
	var searchAutoComplete = document.getElementById('searchAutoComplete');
	var autoCompleteElements = Observable.fromEvent(document, 'DOMNodeInserted');
	var theMovieDbConfig;
	var privatekey = 'api_key=19188b020d3309d58db3633524ed18d6';
	var getJson = function(url) {
		return Observable.create(function(observer) {
			$http.get(url).then(function(result) {
				observer.onNext(result);
			}, function(error) {
				observer.onError(error);
			});
		});
	}

	// Get the movie db config to access the resources.
	var getTheMovieDbConfig =  Observable.create(function(observer) {
			$http.get('https://api.themoviedb.org/3/configuration?' + privatekey).then(function(result) {
				observer.onNext(result);
				observer.onCompleted();
			}, function(error) {
				observer.onError(error);
			});
	});
	
	getTheMovieDbConfig.subscribe(function(result) {
		theMovieDbConfig = result;
	},function(error){
		console.log(error);
	},function(){
		console.log('Completed getting tehmoviedb config...');
	})

	// Auto complete keypress stream
	movieSearchKeypresses = movieSearchKeypresses.map(function(keypress) {
		return {inputValue: keypress.target.value}
	}).debounce(function (keypress) { return Rx.Observable.timer(500) }).filter(function(keypress) {
		$scope.tmdbMovies = keypress.inputValue.trim() == '' ? [] : $scope.tmdbMovies;
		$scope.result = null;
		$scope.$apply();
		return keypress.inputValue.trim() != '';
	}).map(function(item) {
		return getJson('https://api.themoviedb.org/3/search/movie?query=' + item.inputValue + '&'+ privatekey);
	}).switch();

	movieSearchKeypresses.subscribe(function(result) {
		$scope.tmdbMovies = result.data.results.filter(function(movie) {
			return movie.title.toUpperCase().indexOf(movieSearch.value.toUpperCase()) >= 0;
		})
		$scope.tmdbMovies.forEach(function(movie) {
			movieIds.push(movie.id);
		})
	}, function(onerror) {
		console.log(onerror);
	}, function() {
		console.log('Completed');
	});

	//When new li elements with class movie-li is inserted to DOM
	autoCompleteElements = autoCompleteElements.filter(function(event) {
		return event.target.classList ? event.target.classList.contains('movie-li') : false;
	}).map(function(event) {
		return event.target;
	});
	autoCompleteElements.forEach(function(element) {
		element.setAttribute("id", movieIds.shift());
		var movieLiClicks = Observable.fromEvent(element, 'click');
		movieLiClicks = movieLiClicks.map(function(event) {
			return {id: event.target.id ? event.target.id  : event.target.parentElement.id, name: event.target.textContent ? event.target.textContent  : event.target.parentElement.textContent}
		}).map(function(movie) {
			$scope.selectedMovie = movie.name;
			$scope.$apply();
			return getJson('https://api.themoviedb.org/3/movie/'+ movie.id + '?'+ privatekey);
		}).switch();

		movieLiClicks.subscribe(function(result) {
			$scope.tmdbMovies = [];
			$scope.result = result.data;
		})
	});
	
}]);








