export interface Station {
  id: string;
  name: string;
  rent: number;
  safetyScore: number;
}

export interface Edge {
  to: string;
  weight: number;
}

export class Graph {
  nodes: Map<string, Station> = new Map();
  edges: Map<string, Edge[]> = new Map();

  addNode(station: Station) {
    if (!this.nodes.has(station.id)) {
      this.nodes.set(station.id, station);
      this.edges.set(station.id, []);
    }
  }

  addEdge(from: string, to: string, weight: number) {
    this.edges.get(from)?.push({ to, weight });
    this.edges.get(to)?.push({ to: from, weight }); // Undirected
  }

  getStation(id: string): Station | undefined {
    return this.nodes.get(id);
  }

  getAllStations(): Station[] {
    return Array.from(this.nodes.values());
  }
}

// Helper to calculate dummy rent based on distance from center
const calculateDummyRent = (name: string, index: number, total: number, isCenter: boolean) => {
  const base = isCenter ? 180000 : 150000;
  const distanceDiscount = Math.abs(index - total / 2) * 3000;
  return Math.max(60000, base - distanceDiscount);
};

const calculateDummySafety = () => {
  return Math.floor(Math.random() * 3) + 3; // 3 to 5
};

export const initializeGraph = (): Graph => {
  const graph = new Graph();

  const yamanoteStations = [
    "東京", "神田", "秋葉原", "御徒町", "上野", "鶯谷", "日暮里", "西日暮里", "田端", "駒込",
    "巣鴨", "大塚", "池袋", "目白", "高田馬場", "新大久保", "新宿", "代々木", "原宿", "渋谷",
    "恵比寿", "目黒", "五反田", "大崎", "品川", "高輪ゲートウェイ", "田町", "浜松町", "新橋", "有楽町"
  ];

  const chuoStations = [
    "東京", "神田", "御茶ノ水", "水道橋", "飯田橋", "市ケ谷", "四ツ谷", "信濃町", "千駄ケ谷", "代々木",
    "新宿", "大久保", "東中野", "中野", "高円寺", "阿佐ケ谷", "荻窪", "西荻窪", "吉祥寺", "三鷹",
    "武蔵境", "東小金井", "武蔵小金井", "国分寺", "西国分寺", "国立", "立川", "日野", "豊田", "八王子"
  ];

  const keihinTohokuStations = [
    "大宮", "さいたま新都心", "与野", "北浦和", "浦和", "南浦和", "蕨", "西川口", "川口", "赤羽",
    "東十条", "王子", "上中里", "田端", "西日暮里", "日暮里", "鶯谷", "上野", "御徒町", "秋葉原",
    "神田", "東京", "有楽町", "新橋", "浜松町", "田町", "高輪ゲートウェイ", "品川", "大井町", "大森",
    "蒲田", "川崎", "鶴見", "新子安", "東神奈川", "横浜"
  ];

  const toyokoStations = [
    "渋谷", "代官山", "中目黒", "祐天寺", "学芸大学", "都立大学", "自由が丘", "田園調布", "多摩川", "新丸子",
    "武蔵小杉", "元住吉", "日吉", "綱島", "大倉山", "菊名", "妙蓮寺", "白楽", "東白楽", "反町", "横浜"
  ];

  const addLine = (stations: string[], isLoop: boolean, isCenter: boolean) => {
    stations.forEach((name, i) => {
      const id = name; // Using name as ID for simplicity
      if (!graph.nodes.has(id)) {
        graph.addNode({
          id,
          name,
          rent: calculateDummyRent(name, i, stations.length, isCenter),
          safetyScore: calculateDummySafety()
        });
      }
    });

    for (let i = 0; i < stations.length - 1; i++) {
      graph.addEdge(stations[i], stations[i + 1], 2 + Math.floor(Math.random() * 3)); // 2-4 mins
    }

    if (isLoop) {
      graph.addEdge(stations[stations.length - 1], stations[0], 2 + Math.floor(Math.random() * 3));
    }
  };

  addLine(yamanoteStations, true, true);
  addLine(chuoStations, false, false);
  addLine(keihinTohokuStations, false, false);
  addLine(toyokoStations, false, false);

  return graph;
};

export const dijkstra = (graph: Graph, startId: string): Map<string, number> => {
  const distances = new Map<string, number>();
  const unvisited = new Set<string>();

  graph.nodes.forEach((_, id) => {
    distances.set(id, Infinity);
    unvisited.add(id);
  });

  distances.set(startId, 0);

  while (unvisited.size > 0) {
    let currentId: string | null = null;
    let minDistance = Infinity;

    unvisited.forEach(id => {
      const dist = distances.get(id)!;
      if (dist < minDistance) {
        minDistance = dist;
        currentId = id;
      }
    });

    if (currentId === null || minDistance === Infinity) {
      break;
    }

    unvisited.delete(currentId);

    const edges = graph.edges.get(currentId) || [];
    for (const edge of edges) {
      if (unvisited.has(edge.to)) {
        const newDist = minDistance + edge.weight;
        if (newDist < distances.get(edge.to)!) {
          distances.set(edge.to, newDist);
        }
      }
    }
  }

  return distances;
};
