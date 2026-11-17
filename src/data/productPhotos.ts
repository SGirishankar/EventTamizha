import type { PhotoKey } from './config';

/**
 * Product photos for catalogue items.
 * ONLINE — free-licensed photos from Wikimedia Commons, loaded from Wikimedia (credited on the /credits page).
 * LOCAL — the site's own photos in public/photos.
 * Items with neither show their icon. To use your own product photo, add it to public/photos and map it in LOCAL.
 */
export type OnlinePhoto = { src: string; author: string; license: string; page: string };

export const ONLINE: Record<string, OnlinePhoto> = {
  "plastic": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/White_Monobloc_chair.jpg/500px-White_Monobloc_chair.jpg",
    "author": "Seniju",
    "license": "CC BY 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:White_Monobloc_chair.jpg"
  },
  "chaircover": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/DZ6_0468_Spacious_elegantly_lit_banquet_hall_set_up_with_rows_of_white-covered_chairs_facing_a_stage_ready_for_a_large_conference_or_formal_event.jpg/500px-DZ6_0468_Spacious_elegantly_lit_banquet_hall_set_up_with_rows_of_white-covered_chairs_facing_a_stage_ready_for_a_large_conference_or_formal_event.jpg",
    "author": "PattayaPatrol",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:DZ6_0468_Spacious_elegantly_lit_banquet_hall_set_up_with_rows_of_white-covered_chairs_facing_a_stage_ready_for_a_large_conference_or_formal_event.jpg"
  },
  "vip": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8c/Banquet_Room_interior%2C_Brother_Hotel_20130212.jpg/500px-Banquet_Room_interior%2C_Brother_Hotel_20130212.jpg",
    "author": "Ahbmamiat",
    "license": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Banquet_Room_interior,_Brother_Hotel_20130212.jpg"
  },
  "curtain": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Fairy_lights_behind_a_curtain.jpg/500px-Fairy_lights_behind_a_curtain.jpg",
    "author": "W.carter",
    "license": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:Fairy_lights_behind_a_curtain.jpg"
  },
  "led": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5f/%D0%94%D0%B8%D1%81%D0%BA%D0%BE_%D0%BB%D0%B5%D0%B4_%D1%80%D0%BE%D1%82%D0%B8%D1%80%D0%B0%D1%87%D0%BA%D0%BE_%D0%B8_%D1%81%D1%82%D0%B0%D1%82%D0%B8%D1%87%D0%BD%D0%BE_%D0%BE%D1%81%D0%B2%D0%B5%D1%82%D0%BB%D1%83%D0%B2%D0%B0%D1%9A%D0%B5.jpg/500px-%D0%94%D0%B8%D1%81%D0%BA%D0%BE_%D0%BB%D0%B5%D0%B4_%D1%80%D0%BE%D1%82%D0%B8%D1%80%D0%B0%D1%87%D0%BA%D0%BE_%D0%B8_%D1%81%D1%82%D0%B0%D1%82%D0%B8%D1%87%D0%BD%D0%BE_%D0%BE%D1%81%D0%B2%D0%B5%D1%82%D0%BB%D1%83%D0%B2%D0%B0%D1%9A%D0%B5.jpg",
    "author": "Делфина",
    "license": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:%D0%94%D0%B8%D1%81%D0%BA%D0%BE_%D0%BB%D0%B5%D0%B4_%D1%80%D0%BE%D1%82%D0%B8%D1%80%D0%B0%D1%87%D0%BA%D0%BE_%D0%B8_%D1%81%D1%82%D0%B0%D1%82%D0%B8%D1%87%D0%BD%D0%BE_%D0%BE%D1%81%D0%B2%D0%B5%D1%82%D0%BB%D1%83%D0%B2%D0%B0%D1%9A%D0%B5.jpg"
  },
  "fan": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Floor_fan.jpg/500px-Floor_fan.jpg",
    "author": "Hans Olav Lien",
    "license": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Floor_fan.jpg"
  },
  "generator": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/Diesel_Generators.jpg/500px-Diesel_Generators.jpg",
    "author": "Aurora Generators",
    "license": "CC BY 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Diesel_Generators.jpg"
  },
  "sound": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/TOA_IP_Horn_Speaker.png/500px-TOA_IP_Horn_Speaker.png",
    "author": "TOA Brand",
    "license": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:TOA_IP_Horn_Speaker.png"
  },
  "carpet": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/%27Carpet_Rolls%27_-_geograph.org.uk_-_6163652.jpg/500px-%27Carpet_Rolls%27_-_geograph.org.uk_-_6163652.jpg",
    "author": "Anthony O'Neil",
    "license": "CC BY-SA 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:%27Carpet_Rolls%27_-_geograph.org.uk_-_6163652.jpg"
  },
  "mat": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/Plam-leaf_mat%2C_Tamil_Nadu472.jpg/500px-Plam-leaf_mat%2C_Tamil_Nadu472.jpg",
    "author": "தகவலுழவன்",
    "license": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Plam-leaf_mat,_Tamil_Nadu472.jpg"
  },
  "banana": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Banana_Plant_with_Developing_Fruits_%28Musa%29.jpg/500px-Banana_Plant_with_Developing_Fruits_%28Musa%29.jpg",
    "author": "Johnnybam",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Banana_Plant_with_Developing_Fruits_(Musa).jpg"
  },
  "vessels": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/2_Brass_pots_Bhaddu_%28%E0%A4%AD%E0%A4%A1%E0%A5%8D%E0%A4%A1%E0%A5%82%29_4.jpg/500px-2_Brass_pots_Bhaddu_%28%E0%A4%AD%E0%A4%A1%E0%A5%8D%E0%A4%A1%E0%A5%82%29_4.jpg",
    "author": "Rajani Gairshail",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:2_Brass_pots_Bhaddu_(%E0%A4%AD%E0%A4%A1%E0%A5%8D%E0%A4%A1%E0%A5%82)_4.jpg"
  }
};

export const LOCAL: Record<string, PhotoKey> = {
  serial: 'lit-pandal',
  warm: 'lamps-lit',
  entrance: 'lights-setup',
  house: 'town-lights',
  temple: 'temple-lights',
  stagelight: 'theppam-lights',
  kolam: 'kolam-colour',
  vilakku: 'brass-lamps',
  stageflower: 'hero-wedding-stage',
  arch: 'house-pandal',
  drape: 'samiyana',
  dining: 'wedding-lunch',
  long: 'annadanam-canopy',
  stage: 'hero-wedding-stage',
  accessories: 'theenolai',
};
