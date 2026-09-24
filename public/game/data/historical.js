// Historical records are read-only. Null means no verified record was loaded.
window.HISTORICAL_MISSIONS = Object.freeze({
  nan_2025_wipha: Object.freeze({
    mission_id:'nan_2025_wipha',year:2568,event_name:'พายุวิภาและน้ำท่วมน่าน',
    start_datetime:null,end_datetime:null,cause:'อิทธิพลพายุวิภาและมรสุมตะวันตกเฉียงใต้',storm_name:'วิภา',
    rainfall_records:[],water_level_records:[],river_records:[],
    affected_districts:['เมืองน่าน','ภูเพียง','เวียงสา'],affected_subdistricts:null,affected_villages:null,
    affected_population:null,affected_households:null,agriculture_damage:null,road_damage:null,school_damage:null,hospital_damage:null,
    satellite_flood_extent:{observation_date:'2025-07-25',area_rai:22032,geometry:null,source_id:'gistda_2025_07_29'},
    warning_records:[],response_records:[],
    sources:[
      {source_id:'gistda_2025_07_29',source_name:'GISTDA',source_date:'2025-07-29',source_reference:'https://www.gistda.or.th/th/news/gistda-%E0%B9%83%E0%B8%8A%E0%B9%89%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B8%A0%E0%B8%B2%E0%B8%9E%E0%B8%88%E0%B8%B2%E0%B8%81%E0%B8%94%E0%B8%B2%E0%B8%A7%E0%B9%80%E0%B8%97%E0%B8%B5-13/',confidence_level:'source_reported'},
      {source_id:'tmd_2025_07',source_name:'กรมอุตุนิยมวิทยา',source_date:'2025-07',source_reference:'https://www.tmd.go.th/climate/summarymonthly/072025',confidence_level:'source_reported'}
    ]
  })
});
