import React, { useEffect, useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

// PLATEAU 3D Building Layer Component
const PlateauLayer = ({ map, enabled }) => {
  const [threeScene, setThreeScene] = useState(null);
  const [buildings, setBuildings] = useState([]);
  
  // Sample PLATEAU building data for major cities in Hiroshima
  const plateauBuildingData = {
    hiroshima: [
      // Central District - Business Buildings
      { id: 'h1', coordinates: [132.4553, 34.3853], height: 120, floors: 30, type: 'office', name: '広島センタービル' },
      { id: 'h2', coordinates: [132.4590, 34.3939], height: 95, floors: 24, type: 'office', name: '広島ビジネスタワー' },
      { id: 'h3', coordinates: [132.4584, 34.3955], height: 85, floors: 21, type: 'hotel', name: 'リーガロイヤルホテル広島' },
      { id: 'h4', coordinates: [132.4571, 34.3946], height: 80, floors: 20, type: 'hotel', name: 'ANAクラウンプラザ広島' },
      { id: 'h5', coordinates: [132.4625, 34.3946], height: 75, floors: 18, type: 'mixed', name: 'オリエンタルホテル広島' },
      { id: 'h6', coordinates: [132.4600, 34.3920], height: 70, floors: 17, type: 'office', name: '紙屋町ビル' },
      { id: 'h7', coordinates: [132.4610, 34.3935], height: 65, floors: 16, type: 'commercial', name: 'そごう広島店' },
      { id: 'h8', coordinates: [132.4550, 34.3910], height: 60, floors: 15, type: 'office', name: '広島合同庁舎' },
      
      // Hiroshima Station Area
      { id: 'h9', coordinates: [132.4757, 34.3972], height: 110, floors: 28, type: 'hotel', name: 'シェラトングランドホテル広島' },
      { id: 'h10', coordinates: [132.4758, 34.3979], height: 105, floors: 26, type: 'hotel', name: 'ホテルグランヴィア広島' },
      { id: 'h11', coordinates: [132.4765, 34.3958], height: 90, floors: 22, type: 'hotel', name: 'アパホテル広島駅前大橋' },
      { id: 'h12', coordinates: [132.4750, 34.3965], height: 85, floors: 21, type: 'mixed', name: '広島駅前ビル' },
      { id: 'h13', coordinates: [132.4745, 34.3970], height: 80, floors: 20, type: 'office', name: 'JRビル広島' },
      
      // Residential Areas
      { id: 'h14', coordinates: [132.4700, 34.3900], height: 55, floors: 18, type: 'residential', name: 'タワーマンション広島中央' },
      { id: 'h15', coordinates: [132.4650, 34.3880], height: 50, floors: 16, type: 'residential', name: 'プレミアムレジデンス広島' },
      { id: 'h16', coordinates: [132.4680, 34.3950], height: 48, floors: 15, type: 'residential', name: 'ライオンズマンション' },
      
      // Historical/Cultural Buildings
      { id: 'h17', coordinates: [132.4590, 34.4027], height: 39, floors: 5, type: 'cultural', name: '広島城' },
      { id: 'h18', coordinates: [132.4520, 34.3915], height: 25, floors: 3, type: 'cultural', name: '広島平和記念資料館' },
      { id: 'h19', coordinates: [132.4530, 34.3930], height: 20, floors: 4, type: 'cultural', name: '原爆ドーム' },
    ],
    
    fukuyama: [
      { id: 'f1', coordinates: [133.3627, 34.4900], height: 65, floors: 16, type: 'mixed', name: '福山ニューキャッスルホテル' },
      { id: 'f2', coordinates: [133.3635, 34.4882], height: 60, floors: 15, type: 'office', name: '福山駅前ビル' },
      { id: 'f3', coordinates: [133.3630, 34.4885], height: 55, floors: 14, type: 'hotel', name: 'リッチモンドホテル福山駅前' },
      { id: 'f4', coordinates: [133.3625, 34.4880], height: 50, floors: 12, type: 'commercial', name: 'イトーヨーカドー福山店' },
      { id: 'f5', coordinates: [133.3620, 34.4875], height: 45, floors: 11, type: 'office', name: '福山商工会議所ビル' },
      { id: 'f6', coordinates: [133.3627, 34.4900], height: 30, floors: 5, type: 'cultural', name: '福山城' },
    ],
    
    kure: [
      { id: 'k1', coordinates: [132.5552, 34.2415], height: 55, floors: 14, type: 'hotel', name: 'クレイトンベイホテル' },
      { id: 'k2', coordinates: [132.5658, 34.2492], height: 50, floors: 12, type: 'mixed', name: '呉駅前ビル' },
      { id: 'k3', coordinates: [132.5655, 34.2488], height: 45, floors: 11, type: 'hotel', name: '呉阪急ホテル' },
      { id: 'k4', coordinates: [132.5550, 34.2410], height: 30, floors: 4, type: 'cultural', name: '大和ミュージアム' },
      { id: 'k5', coordinates: [132.5560, 34.2420], height: 25, floors: 3, type: 'cultural', name: '海上自衛隊呉史料館' },
    ],
    
    higashihiroshima: [
      { id: 'hh1', coordinates: [132.7430, 34.4290], height: 45, floors: 11, type: 'hotel', name: 'ホテルグランカーサ' },
      { id: 'hh2', coordinates: [132.7425, 34.4285], height: 50, floors: 12, type: 'hotel', name: '東横イン東広島西条駅前' },
      { id: 'hh3', coordinates: [132.7428, 34.4288], height: 48, floors: 12, type: 'hotel', name: 'ホテルルートイン東広島' },
      { id: 'hh4', coordinates: [132.7440, 34.4295], height: 40, floors: 10, type: 'office', name: '西条駅前ビル' },
      { id: 'hh5', coordinates: [132.7426, 34.4286], height: 20, floors: 2, type: 'cultural', name: '西条酒蔵通り建造物群' },
    ],
    
    onomichi: [
      { id: 'o1', coordinates: [133.2050, 34.4095], height: 40, floors: 10, type: 'hotel', name: '尾道国際ホテル' },
      { id: 'o2', coordinates: [133.2042, 34.4088], height: 45, floors: 11, type: 'hotel', name: 'ホテルα-1尾道' },
      { id: 'o3', coordinates: [133.2055, 34.4098], height: 42, floors: 10, type: 'mixed', name: '尾道駅前ビル' },
      { id: 'o4', coordinates: [133.2060, 34.4120], height: 25, floors: 3, type: 'cultural', name: '尾道市立美術館' },
      { id: 'o5', coordinates: [133.2050, 34.4100], height: 30, floors: 4, type: 'cultural', name: '千光寺' },
    ],
    
    hatsukaichi: [
      { id: 'ht1', coordinates: [132.3318, 34.3486], height: 35, floors: 8, type: 'mixed', name: '廿日市駅前ビル' },
      { id: 'ht2', coordinates: [132.3320, 34.3490], height: 30, floors: 7, type: 'commercial', name: 'ゆめタウン廿日市' },
      { id: 'ht3', coordinates: [132.3215, 34.2945], height: 25, floors: 5, type: 'hotel', name: '宮島グランドホテル有もと' },
      { id: 'ht4', coordinates: [132.3185, 34.2908], height: 15, floors: 2, type: 'cultural', name: '厳島神社' },
      { id: 'ht5', coordinates: [132.3150, 34.2890], height: 20, floors: 4, type: 'hotel', name: '岩惣' },
    ]
  };
  
  // Building type colors
  const buildingColors = {
    office: 0x4A90E2,      // Blue
    hotel: 0x9B59B6,       // Purple
    residential: 0x2ECC71, // Green
    commercial: 0xF39C12,  // Orange
    mixed: 0x7F8C8D,       // Gray
    cultural: 0xE74C3C     // Red
  };
  
  useEffect(() => {
    if (!map || !enabled) return;
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
    
    // CSS2D Renderer for labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    
    // Add Three.js renderer to map container
    const mapContainer = map.getContainer();
    mapContainer.appendChild(renderer.domElement);
    mapContainer.appendChild(labelRenderer.domElement);
    
    // Position the renderer
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '999';
    renderer.domElement.style.pointerEvents = 'none';
    
    // Create building meshes
    const buildingMeshes = [];
    
    Object.entries(plateauBuildingData).forEach(([city, cityBuildings]) => {
      cityBuildings.forEach(building => {
        const geometry = new THREE.BoxGeometry(0.002, building.height / 1000, 0.002);
        const material = new THREE.MeshPhongMaterial({
          color: buildingColors[building.type] || 0x808080,
          emissive: buildingColors[building.type] || 0x808080,
          emissiveIntensity: 0.1,
          opacity: 0.8,
          transparent: true
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Convert coordinates to Three.js position
        const [lng, lat] = building.coordinates;
        mesh.position.set(
          (lng - 132.75) * 100,
          building.height / 2000,
          -(lat - 34.5) * 100
        );
        
        mesh.userData = building;
        scene.add(mesh);
        buildingMeshes.push(mesh);
        
        // Add label for important buildings
        if (building.type === 'cultural' || building.height > 80) {
          const labelDiv = document.createElement('div');
          labelDiv.className = 'building-label';
          labelDiv.textContent = building.name;
          labelDiv.style.marginTop = '-1em';
          labelDiv.style.fontSize = '12px';
          labelDiv.style.color = '#ffffff';
          labelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          labelDiv.style.padding = '2px 6px';
          labelDiv.style.borderRadius = '3px';
          labelDiv.style.whiteSpace = 'nowrap';
          
          const label = new CSS2DObject(labelDiv);
          label.position.set(0, building.height / 1000 + 0.01, 0);
          mesh.add(label);
        }
      });
    });
    
    // Update camera based on map view
    const updateCamera = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      
      camera.position.set(
        (center.lng - 132.75) * 100,
        2 / Math.pow(2, zoom - 10),
        -(center.lat - 34.5) * 100 + 1
      );
      
      camera.lookAt(
        (center.lng - 132.75) * 100,
        0,
        -(center.lat - 34.5) * 100
      );
    };
    
    // Initial camera setup
    updateCamera();
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate buildings slightly for visual interest
      buildingMeshes.forEach(mesh => {
        mesh.rotation.y += 0.001;
      });
      
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    
    animate();
    
    // Update on map events
    map.on('move', updateCamera);
    map.on('zoom', updateCamera);
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      labelRenderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    setThreeScene({ scene, camera, renderer, labelRenderer });
    setBuildings(buildingMeshes);
    
    // Cleanup
    return () => {
      map.off('move', updateCamera);
      map.off('zoom', updateCamera);
      window.removeEventListener('resize', handleResize);
      
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      if (labelRenderer.domElement && labelRenderer.domElement.parentNode) {
        labelRenderer.domElement.parentNode.removeChild(labelRenderer.domElement);
      }
      
      buildingMeshes.forEach(mesh => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      
      renderer.dispose();
    };
  }, [map, enabled]);
  
  // Handle map click events
  useMapEvents({
    click: (e) => {
      if (!enabled || !threeScene) return;
      
      // Convert click coordinates to Three.js coordinates
      const mouse = new THREE.Vector2(
        (e.originalEvent.clientX / window.innerWidth) * 2 - 1,
        -(e.originalEvent.clientY / window.innerHeight) * 2 + 1
      );
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, threeScene.camera);
      
      const intersects = raycaster.intersectObjects(buildings);
      
      if (intersects.length > 0) {
        const building = intersects[0].object.userData;
        
        // Create popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${building.name}</h3>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${building.type}</p>
            <p style="margin: 5px 0;"><strong>Height:</strong> ${building.height}m</p>
            <p style="margin: 5px 0;"><strong>Floors:</strong> ${building.floors}</p>
          </div>
        `;
        
        // Show popup at building location
        L.popup()
          .setLatLng(building.coordinates)
          .setContent(popupContent)
          .openOn(map);
      }
    }
  });
  
  return null;
};

export default PlateauLayer;