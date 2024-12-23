# CapStone Project

네이버 지도 API를 활용한 Q&A 기반 경로 추천 시스템

## 개발 목표

사용자 질문(Q&A)을 기반으로 추천 경로 및 위치를 제공하는 지능형 지도 서비스 구현.

## 주요기능

- 지도 유형 선택(일반, 위성, 하이브리드 등)
- 출발지와 도착지 간 경로 탐색 및 시각화
- 실시간 교통 정보 활성화/비활성화
- Q&A 시스템(Open API 기반)

# 사용 기술 스택

1.프론트엔드
- HTML ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
- JavaScript ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
- CSS ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)

2.지도 API
- 네이버 지도 API
  
3.외부 API
- Google Places API
- OpenAI GPT API ![ChatGPT](https://img.shields.io/badge/chatGPT-74aa9c?style=for-the-badge&logo=openai&logoColor=white)

## 주요코드 1
findRoute(startLatLng, endLatLng) 
Naver Directions API를 호출해 출발지와 도착지 사이의 최적 경로를 탐색하고 지도에 표시합니다.

```javascript
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
```
## 실행화면
![image](https://github.com/user-attachments/assets/24f4dfdb-1d64-4383-ae87-c96ecfa40ac5)


## 주요코드 2
getCoordinatesFromGooglePlaces(query, callback) 
Google Places API를 사용해 입력된 텍스트 주소를 좌표로 변환합니다.

```javascript
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
```
## 주요코드 3
handleUserQuestion(question, callback)
사용자 질문 처리 함수 (OpenAI API 사용)
```javascript
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
```

## 실행화면
![image](https://github.com/user-attachments/assets/1f699740-3dc2-45a4-8211-4a74433f897d)

## 주요코드 4
addMarkerToMap(latLng, title) 
지도에 마커 추가 함수
```javascript
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
```

## 주요코드 5
TrafficLayer() 
교통 정보 레이어 추가
```javascript
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
```
## 실행화면
![image](https://github.com/user-attachments/assets/b1fd11ab-df41-4e3e-bff6-564188e53b93)
![image](https://github.com/user-attachments/assets/11cf6614-7337-4a89-a8dd-764335e4ca79)



## 주요코드 6
changeMapType() 
사용자가 선택한 지도 유형(일반, 위성, 하이브리드)을 변경합니다.

```javascript
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
```
## 실행화면
![image](https://github.com/user-attachments/assets/79e41a08-c5f0-4773-8900-df5577353443)











