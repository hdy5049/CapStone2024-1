// CORS 비활성화 크롬 : open -na "Google Chrome" --args --disable-web-security --user-data-dir="/tmp/chrome_dev"
document.addEventListener('DOMContentLoaded', function () {
  var mapTypeSelect = document.getElementById('mapType');
  if (mapTypeSelect) {
    mapTypeSelect.addEventListener('change', function () {
      var selectedType = mapTypeSelect.value;
      if (selectedType === 'normal') {
        map.setMapTypeId(naver.maps.MapTypeId.NORMAL);
      } else if (selectedType === 'satellite') {
        map.setMapTypeId(naver.maps.MapTypeId.SATELLITE);
      } else if (selectedType === 'hybrid') {
        map.setMapTypeId(naver.maps.MapTypeId.HYBRID);
      }
      console.log("지도 유형 변경됨: ", selectedType);
    });
  }
  // 지도 초기화
  var map = new naver.maps.Map('map', {
    center: new naver.maps.LatLng(37.5665, 126.9780), // 서울 중심 좌표
    zoom: 13,
  });

  console.log("지도 초기화 완료");

  // 교통 정보 레이어 추가
  var trafficLayer = new naver.maps.TrafficLayer();
  var trafficVisible = false; // 교통 정보 초기 상태 (비활성화)

  // 교통 정보 켜기/끄기 버튼 클릭 이벤트
  var toggleTrafficBtn = document.getElementById('toggleTraffic');
  if (toggleTrafficBtn) {
    toggleTrafficBtn.addEventListener('click', function () {
      trafficVisible = !trafficVisible;
      if (trafficVisible) {
        trafficLayer.setMap(map);
        console.log("교통 정보 레이어 활성화");
      } else {
        trafficLayer.setMap(null);
        console.log("교통 정보 레이어 비활성화");
      }
    });
  }

  // 경로 폴리라인 초기화 변수 추가
  var polyline = null;

  // 출발지와 도착지 마커 초기화 변수 추가
  var startMarker = null;
  var endMarker = null;
  var recommendationMarker = null; // 추천 위치 마커 변수 추가

  // 경로 찾기 버튼 클릭 이벤트
  var findRouteBtn = document.getElementById('findRoute');
  if (findRouteBtn) {
    findRouteBtn.addEventListener('click', function () {
      var start = document.getElementById('start').value.trim();
      var end = document.getElementById('end').value.trim();

      if (!start || !end) {
        alert('출발지와 도착지를 정확히 입력하세요.');
        return;
      }

      console.log("출발지와 도착지 정보 입력됨. 변환을 시작합니다.");

      // 출발지와 도착지의 주소 변환 시작
      getCoordinatesFromGooglePlaces(start, function (startLatLng) {
        if (!startLatLng) {
          alert('출발지의 좌표를 찾을 수 없습니다.');
          return;
        }

        getCoordinatesFromGooglePlaces(end, function (endLatLng) {
          if (!endLatLng) {
            alert('도착지의 좌표를 찾을 수 없습니다.');
            return;
          }

          // 좌표가 정상적으로 변환된 경우에만 경로 탐색 시도
          console.log("좌표 변환 완료: 출발지 =", startLatLng, "도착지 =", endLatLng);
          findRoute(startLatLng, endLatLng);
        });
      });
    });
  }

  // Q&A 질문 처리 버튼 클릭 이벤트
  var qnaBtn = document.getElementById('qnaBtn');
  if (qnaBtn) {
    qnaBtn.addEventListener('click', function () {
      var question = document.getElementById('userQuestion').value.trim();

      if (!question) {
        alert('질문을 입력하세요.');
        return;
      }

      console.log("사용자 질문:", question);

      // OpenAI API를 사용하여 질문 처리
      handleUserQuestion(question, function (answer, coordinates) {
        alert(answer);

        if (coordinates && coordinates.lat && coordinates.lng) {
          const latLng = new naver.maps.LatLng(coordinates.lat, coordinates.lng);
          addMarkerToMap(latLng, "추천 위치");
          map.setCenter(latLng);
        } else {
          console.error("추천 위치의 좌표를 찾을 수 없습니다.");
        }
      });
    });
  } else {
    console.error("Q&A 버튼을 찾을 수 없습니다. HTML에서 qnaBtn 요소를 확인하세요.");
  }

  // Google Places API를 통해 주소를 위도/경도로 변환
  function getCoordinatesFromGooglePlaces(query, callback) {
    const googleApiKey = "";

    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=geometry&key=${googleApiKey}`;

    console.log("Google Places API 호출 URL:", url);

    fetch(url)
      .then((response) => {
        console.log("Google Places API 응답 상태 코드:", response.status);
        if (!response.ok) {
          throw new Error(`Google Places API 호출 실패 - 상태 코드: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Google Places API 응답 데이터:", data);
        if (data.candidates && data.candidates.length > 0) {
          const location = data.candidates[0].geometry.location;
          callback({ lat: location.lat, lng: location.lng });
        } else {
          console.error("Google Places API에서 장소를 찾지 못했습니다.");
          callback(null);
        }
      })
      .catch((error) => {
        console.error("Google Places API 호출 실패:", error);
        callback(null);
      });
  }

  // 사용자 질문 처리 함수 (OpenAI API 사용)
  function handleUserQuestion(question, callback) {
    const openAiKey = "";

    // OpenAI API를 사용하여 질문에 대한 답변 생성
    const messageContent = `The user asked: "${question}". Please provide a detailed and helpful response.`;

    console.log("OpenAI API에 요청 보냄");

    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: messageContent }],
        max_tokens: 150,
      }),
    })
      .then((aiResponse) => {
        if (!aiResponse.ok) {
          throw new Error(`OpenAI API 호출 실패 - 상태 코드: ${aiResponse.status}`);
        }
        return aiResponse.json();
      })
      .then((aiData) => {
        console.log("OpenAI API 응답:", aiData);
        if (aiData && aiData.choices && aiData.choices.length > 0) {
          const answer = aiData.choices[0].message.content.trim();
          // OpenAI 응답에서 위치 이름 추출 후 Google Places API로 좌표 찾기
          getCoordinatesFromGooglePlaces(question, (coordinates) => {
            callback(answer, coordinates);
          });
        } else {
          callback("질문에 대한 답변을 생성할 수 없습니다. 다시 시도해주세요.", null);
        }
      })
      .catch((error) => {
        console.error("OpenAI API 호출 실패:", error);
        callback("OpenAI API 호출 중 오류가 발생했습니다. 다시 시도해주세요.", null);
      });
  }

  // 지도에 마커 추가 함수
  function addMarkerToMap(latLng, title) {
    if (!latLng || (latLng.lat === 0 && latLng.lng === 0)) {
      console.error("유효하지 않은 좌표입니다. 마커를 추가할 수 없습니다.");
      return;
    }

    if (recommendationMarker) {
      recommendationMarker.setMap(null); // 기존 추천 마커 제거
    }
    recommendationMarker = new naver.maps.Marker({
      position: latLng,
      map: map,
      title: title,
    });
    console.log(`${title} 위치에 마커 추가됨:`, latLng);
  }

  // 경로 찾기 (자동차 경로 탐색)
  function findRoute(startLatLng, endLatLng) {
    var start = `${startLatLng.lng},${startLatLng.lat}`;
    var goal = `${endLatLng.lng},${endLatLng.lat}`;

    console.log("경로 탐색 시작 - 출발지:", start, "도착지:", goal);

    var url = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}`;

    var headers = {
      '',
      '',
    };

    fetch(url, { headers: headers })
      .then((response) => {
        console.log("Directions API 호출 상태 코드:", response.status);
        if (!response.ok) {
          throw new Error(`Directions API 호출 실패 - 상태 코드: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Directions API 응답 데이터:", data);
        if (data.code !== 0 || !data.route || !data.route.traoptimal || data.route.traoptimal.length === 0) {
          alert('경로 탐색 실패: 경로를 찾을 수 없습니다.');
          return;
        }

        const route = data.route.traoptimal[0].path;
        const path = route.map((point) => new naver.maps.LatLng(point[1], point[0]));

        // 기존 경로 삭제
        if (polyline) {
          polyline.setMap(null);
        }

        // 새 경로 그리기
        polyline = new naver.maps.Polyline({
          map: map,
          path: path,
          strokeColor: '#FF0000',
          strokeWeight: 4,
        });

        // 출발지 마커 설정
        if (startMarker) {
          startMarker.setMap(null);
        }
        startMarker = new naver.maps.Marker({
          position: new naver.maps.LatLng(startLatLng.lat, startLatLng.lng),
          map: map,
          title: "출발지",
        });

        // 도착지 마커 설정
        if (endMarker) {
          endMarker.setMap(null);
        }
        endMarker = new naver.maps.Marker({
          position: new naver.maps.LatLng(endLatLng.lat, endLatLng.lng),
          map: map,
          title: "도착지",
        });

        // 지도 경로 포함되도록 영역 설정
        const bounds = new naver.maps.LatLngBounds();
        path.forEach((point) => bounds.extend(point));
        map.fitBounds(bounds);

        // 경로 요약 정보 출력
        const distance = data.route.traoptimal[0].summary.distance; // 거리 (미터)
        const duration = data.route.traoptimal[0].summary.duration; // 시간 (밀리초)
        alert(`경로 거리: ${(distance / 1000).toFixed(2)} km, 예상 시간: ${(duration / 60000).toFixed(1)} 분`);
      })
      .catch((err) => {
        console.error('Directions API 호출 실패:', err.message);
        alert('경로 탐색에 실패했습니다. 네트워크 상태를 확인하고 다시 시도해주세요.');
      });
  }
});
