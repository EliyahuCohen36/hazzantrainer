/**
 * For each parasha (by its number, 1–54): the weekday reading (Monday, Thursday
 * and Shabbat Minha: Kohen, Levi, Yisrael) and the haftarah, from
 * @hebcal/leyning. "syrian" is the Sephardic haftarah (also Yerushalmi);
 * "ashkenaz" is kept for when that nusach opens. Confirm with your Hazzan.
 */
export interface Range {
  from: string;
  to: string;
}
export interface HaftarahPart extends Range {
  /** Book id in src/data/tanakh; part = "alef"/"bet" or the prophet in Tere Asar. */
  book: string;
  part: string | null;
}
export interface ParashaExtra {
  weekday?: Range[];
  syrian: HaftarahPart[];
  ashkenaz: HaftarahPart[];
}

export const PARASHA_EXTRA: Record<number, ParashaExtra> = {
  "1": {
    weekday: [
      {
        from: "1:1",
        to: "1:5",
      },
      {
        from: "1:6",
        to: "1:8",
      },
      {
        from: "1:9",
        to: "1:13",
      },
    ],
    syrian: [
      {
        book: "yeshayahu",
        part: null,
        from: "42:5",
        to: "42:21",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "42:5",
        to: "43:10",
      },
    ],
  },
  "2": {
    weekday: [
      {
        from: "6:9",
        to: "6:16",
      },
      {
        from: "6:17",
        to: "6:19",
      },
      {
        from: "6:20",
        to: "6:22",
      },
    ],
    syrian: [
      {
        book: "yeshayahu",
        part: null,
        from: "54:1",
        to: "54:10",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "54:1",
        to: "55:5",
      },
    ],
  },
  "3": {
    weekday: [
      {
        from: "12:1",
        to: "12:3",
      },
      {
        from: "12:4",
        to: "12:9",
      },
      {
        from: "12:10",
        to: "12:13",
      },
    ],
    syrian: [
      {
        book: "yeshayahu",
        part: null,
        from: "40:27",
        to: "41:16",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "40:27",
        to: "41:16",
      },
    ],
  },
  "4": {
    weekday: [
      {
        from: "18:1",
        to: "18:5",
      },
      {
        from: "18:6",
        to: "18:8",
      },
      {
        from: "18:9",
        to: "18:14",
      },
    ],
    syrian: [
      {
        book: "melakhim",
        part: "bet",
        from: "4:1",
        to: "4:23",
      },
    ],
    ashkenaz: [
      {
        book: "melakhim",
        part: "bet",
        from: "4:1",
        to: "4:37",
      },
    ],
  },
  "5": {
    weekday: [
      {
        from: "23:1",
        to: "23:7",
      },
      {
        from: "23:8",
        to: "23:12",
      },
      {
        from: "23:13",
        to: "23:16",
      },
    ],
    syrian: [
      {
        book: "melakhim",
        part: "alef",
        from: "1:1",
        to: "1:31",
      },
    ],
    ashkenaz: [
      {
        book: "melakhim",
        part: "alef",
        from: "1:1",
        to: "1:31",
      },
    ],
  },
  "6": {
    weekday: [
      {
        from: "25:19",
        to: "25:22",
      },
      {
        from: "25:23",
        to: "25:26",
      },
      {
        from: "25:27",
        to: "26:5",
      },
    ],
    syrian: [
      {
        book: "tere-asar",
        part: "malakhi",
        from: "1:1",
        to: "2:7",
      },
    ],
    ashkenaz: [
      {
        book: "tere-asar",
        part: "malakhi",
        from: "1:1",
        to: "2:7",
      },
    ],
  },
  "7": {
    weekday: [
      {
        from: "28:10",
        to: "28:12",
      },
      {
        from: "28:13",
        to: "28:17",
      },
      {
        from: "28:18",
        to: "28:22",
      },
    ],
    syrian: [
      {
        book: "tere-asar",
        part: "hoshea",
        from: "11:7",
        to: "12:12",
      },
    ],
    ashkenaz: [
      {
        book: "tere-asar",
        part: "hoshea",
        from: "12:13",
        to: "14:10",
      },
    ],
  },
  "8": {
    weekday: [
      {
        from: "32:4",
        to: "32:6",
      },
      {
        from: "32:7",
        to: "32:9",
      },
      {
        from: "32:10",
        to: "32:13",
      },
    ],
    syrian: [
      {
        book: "tere-asar",
        part: "ovadya",
        from: "1:1",
        to: "1:21",
      },
    ],
    ashkenaz: [
      {
        book: "tere-asar",
        part: "ovadya",
        from: "1:1",
        to: "1:21",
      },
    ],
  },
  "9": {
    weekday: [
      {
        from: "37:1",
        to: "37:3",
      },
      {
        from: "37:4",
        to: "37:7",
      },
      {
        from: "37:8",
        to: "37:11",
      },
    ],
    syrian: [
      {
        book: "tere-asar",
        part: "amos",
        from: "2:6",
        to: "3:8",
      },
    ],
    ashkenaz: [
      {
        book: "tere-asar",
        part: "amos",
        from: "2:6",
        to: "3:8",
      },
    ],
  },
  "10": {
    weekday: [
      {
        from: "41:1",
        to: "41:4",
      },
      {
        from: "41:5",
        to: "41:7",
      },
      {
        from: "41:8",
        to: "41:14",
      },
    ],
    syrian: [
      {
        book: "melakhim",
        part: "alef",
        from: "3:15",
        to: "4:1",
      },
    ],
    ashkenaz: [
      {
        book: "melakhim",
        part: "alef",
        from: "3:15",
        to: "4:1",
      },
    ],
  },
  "11": {
    weekday: [
      {
        from: "44:18",
        to: "44:20",
      },
      {
        from: "44:21",
        to: "44:24",
      },
      {
        from: "44:25",
        to: "44:30",
      },
    ],
    syrian: [
      {
        book: "yehezkel",
        part: null,
        from: "37:15",
        to: "37:28",
      },
    ],
    ashkenaz: [
      {
        book: "yehezkel",
        part: null,
        from: "37:15",
        to: "37:28",
      },
    ],
  },
  "12": {
    weekday: [
      {
        from: "47:28",
        to: "47:31",
      },
      {
        from: "48:1",
        to: "48:3",
      },
      {
        from: "48:4",
        to: "48:9",
      },
    ],
    syrian: [
      {
        book: "melakhim",
        part: "alef",
        from: "2:1",
        to: "2:12",
      },
    ],
    ashkenaz: [
      {
        book: "melakhim",
        part: "alef",
        from: "2:1",
        to: "2:12",
      },
    ],
  },
  "13": {
    weekday: [
      {
        from: "1:1",
        to: "1:7",
      },
      {
        from: "1:8",
        to: "1:12",
      },
      {
        from: "1:13",
        to: "1:17",
      },
    ],
    syrian: [
      {
        book: "yirmeyahu",
        part: null,
        from: "1:1",
        to: "2:3",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "27:6",
        to: "28:13",
      },
      {
        book: "yeshayahu",
        part: null,
        from: "29:22",
        to: "29:23",
      },
    ],
  },
  "14": {
    weekday: [
      {
        from: "6:2",
        to: "6:5",
      },
      {
        from: "6:6",
        to: "6:9",
      },
      {
        from: "6:10",
        to: "6:13",
      },
    ],
    syrian: [
      {
        book: "yehezkel",
        part: null,
        from: "28:25",
        to: "29:21",
      },
    ],
    ashkenaz: [
      {
        book: "yehezkel",
        part: null,
        from: "28:25",
        to: "29:21",
      },
    ],
  },
  "15": {
    weekday: [
      {
        from: "10:1",
        to: "10:3",
      },
      {
        from: "10:4",
        to: "10:6",
      },
      {
        from: "10:7",
        to: "10:11",
      },
    ],
    syrian: [
      {
        book: "yirmeyahu",
        part: null,
        from: "46:13",
        to: "46:28",
      },
    ],
    ashkenaz: [
      {
        book: "yirmeyahu",
        part: null,
        from: "46:13",
        to: "46:28",
      },
    ],
  },
  "16": {
    weekday: [
      {
        from: "13:17",
        to: "13:22",
      },
      {
        from: "14:1",
        to: "14:4",
      },
      {
        from: "14:5",
        to: "14:8",
      },
    ],
    syrian: [
      {
        book: "shofetim",
        part: null,
        from: "5:1",
        to: "5:31",
      },
    ],
    ashkenaz: [
      {
        book: "shofetim",
        part: null,
        from: "4:4",
        to: "5:31",
      },
    ],
  },
  "17": {
    weekday: [
      {
        from: "18:1",
        to: "18:4",
      },
      {
        from: "18:5",
        to: "18:8",
      },
      {
        from: "18:9",
        to: "18:12",
      },
    ],
    syrian: [
      {
        book: "yeshayahu",
        part: null,
        from: "6:1",
        to: "6:13",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "6:1",
        to: "7:6",
      },
      {
        book: "yeshayahu",
        part: null,
        from: "9:5",
        to: "9:6",
      },
    ],
  },
  "18": {
    weekday: [
      {
        from: "21:1",
        to: "21:6",
      },
      {
        from: "21:7",
        to: "21:11",
      },
      {
        from: "21:12",
        to: "21:19",
      },
    ],
    syrian: [
      {
        book: "yirmeyahu",
        part: null,
        from: "34:8",
        to: "34:22",
      },
      {
        book: "yirmeyahu",
        part: null,
        from: "33:25",
        to: "33:26",
      },
    ],
    ashkenaz: [
      {
        book: "yirmeyahu",
        part: null,
        from: "34:8",
        to: "34:22",
      },
      {
        book: "yirmeyahu",
        part: null,
        from: "33:25",
        to: "33:26",
      },
    ],
  },
  "19": {
    weekday: [
      {
        from: "25:1",
        to: "25:5",
      },
      {
        from: "25:6",
        to: "25:9",
      },
      {
        from: "25:10",
        to: "25:16",
      },
    ],
    syrian: [
      {
        book: "melakhim",
        part: "alef",
        from: "5:26",
        to: "6:13",
      },
    ],
    ashkenaz: [
      {
        book: "melakhim",
        part: "alef",
        from: "5:26",
        to: "6:13",
      },
    ],
  },
  "20": {
    weekday: [
      {
        from: "27:20",
        to: "28:5",
      },
      {
        from: "28:6",
        to: "28:9",
      },
      {
        from: "28:10",
        to: "28:12",
      },
    ],
    syrian: [
      {
        book: "yehezkel",
        part: null,
        from: "43:10",
        to: "43:27",
      },
    ],
    ashkenaz: [
      {
        book: "yehezkel",
        part: null,
        from: "43:10",
        to: "43:27",
      },
    ],
  },
  "21": {
    weekday: [
      {
        from: "30:11",
        to: "30:13",
      },
      {
        from: "30:14",
        to: "30:16",
      },
      {
        from: "30:17",
        to: "30:21",
      },
    ],
    syrian: [
      {
        book: "melakhim",
        part: "alef",
        from: "18:20",
        to: "18:39",
      },
    ],
    ashkenaz: [
      {
        book: "melakhim",
        part: "alef",
        from: "18:1",
        to: "18:39",
      },
    ],
  },
  "22": {
    weekday: [
      {
        from: "35:1",
        to: "35:3",
      },
      {
        from: "35:4",
        to: "35:10",
      },
      {
        from: "35:11",
        to: "35:20",
      },
    ],
    syrian: [
      {
        book: "melakhim",
        part: "alef",
        from: "7:13",
        to: "7:26",
      },
    ],
    ashkenaz: [
      {
        book: "melakhim",
        part: "alef",
        from: "7:40",
        to: "7:50",
      },
    ],
  },
  "23": {
    weekday: [
      {
        from: "38:21",
        to: "38:23",
      },
      {
        from: "38:24",
        to: "38:27",
      },
      {
        from: "38:28",
        to: "39:1",
      },
    ],
    syrian: [
      {
        book: "melakhim",
        part: "alef",
        from: "7:40",
        to: "7:50",
      },
    ],
    ashkenaz: [
      {
        book: "melakhim",
        part: "alef",
        from: "7:51",
        to: "8:21",
      },
    ],
  },
  "24": {
    weekday: [
      {
        from: "1:1",
        to: "1:4",
      },
      {
        from: "1:5",
        to: "1:9",
      },
      {
        from: "1:10",
        to: "1:13",
      },
    ],
    syrian: [
      {
        book: "yeshayahu",
        part: null,
        from: "43:21",
        to: "44:23",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "43:21",
        to: "44:23",
      },
    ],
  },
  "25": {
    weekday: [
      {
        from: "6:1",
        to: "6:3",
      },
      {
        from: "6:4",
        to: "6:6",
      },
      {
        from: "6:7",
        to: "6:11",
      },
    ],
    syrian: [
      {
        book: "yirmeyahu",
        part: null,
        from: "7:21",
        to: "8:3",
      },
      {
        book: "yirmeyahu",
        part: null,
        from: "9:22",
        to: "9:23",
      },
    ],
    ashkenaz: [
      {
        book: "yirmeyahu",
        part: null,
        from: "7:21",
        to: "8:3",
      },
      {
        book: "yirmeyahu",
        part: null,
        from: "9:22",
        to: "9:23",
      },
    ],
  },
  "26": {
    weekday: [
      {
        from: "9:1",
        to: "9:6",
      },
      {
        from: "9:7",
        to: "9:10",
      },
      {
        from: "9:11",
        to: "9:16",
      },
    ],
    syrian: [
      {
        book: "shemuel",
        part: "bet",
        from: "6:1",
        to: "6:19",
      },
    ],
    ashkenaz: [
      {
        book: "shemuel",
        part: "bet",
        from: "6:1",
        to: "7:17",
      },
    ],
  },
  "27": {
    weekday: [
      {
        from: "12:1",
        to: "12:4",
      },
      {
        from: "12:5",
        to: "12:8",
      },
      {
        from: "13:1",
        to: "13:5",
      },
    ],
    syrian: [
      {
        book: "melakhim",
        part: "bet",
        from: "4:42",
        to: "5:19",
      },
    ],
    ashkenaz: [
      {
        book: "melakhim",
        part: "bet",
        from: "4:42",
        to: "5:19",
      },
    ],
  },
  "28": {
    weekday: [
      {
        from: "14:1",
        to: "14:5",
      },
      {
        from: "14:6",
        to: "14:9",
      },
      {
        from: "14:10",
        to: "14:12",
      },
    ],
    syrian: [
      {
        book: "melakhim",
        part: "bet",
        from: "7:3",
        to: "7:20",
      },
    ],
    ashkenaz: [
      {
        book: "melakhim",
        part: "bet",
        from: "7:3",
        to: "7:20",
      },
    ],
  },
  "29": {
    weekday: [
      {
        from: "16:1",
        to: "16:6",
      },
      {
        from: "16:7",
        to: "16:11",
      },
      {
        from: "16:12",
        to: "16:17",
      },
    ],
    syrian: [
      {
        book: "yehezkel",
        part: null,
        from: "22:1",
        to: "22:16",
      },
    ],
    ashkenaz: [
      {
        book: "tere-asar",
        part: "amos",
        from: "9:7",
        to: "9:15",
      },
    ],
  },
  "30": {
    weekday: [
      {
        from: "19:1",
        to: "19:4",
      },
      {
        from: "19:5",
        to: "19:10",
      },
      {
        from: "19:11",
        to: "19:14",
      },
    ],
    syrian: [
      {
        book: "yehezkel",
        part: null,
        from: "20:2",
        to: "20:20",
      },
    ],
    ashkenaz: [
      {
        book: "yehezkel",
        part: null,
        from: "22:1",
        to: "22:19",
      },
    ],
  },
  "31": {
    weekday: [
      {
        from: "21:1",
        to: "21:6",
      },
      {
        from: "21:7",
        to: "21:12",
      },
      {
        from: "21:13",
        to: "21:15",
      },
    ],
    syrian: [
      {
        book: "yehezkel",
        part: null,
        from: "44:15",
        to: "44:31",
      },
    ],
    ashkenaz: [
      {
        book: "yehezkel",
        part: null,
        from: "44:15",
        to: "44:31",
      },
    ],
  },
  "32": {
    weekday: [
      {
        from: "25:1",
        to: "25:3",
      },
      {
        from: "25:4",
        to: "25:7",
      },
      {
        from: "25:8",
        to: "25:13",
      },
    ],
    syrian: [
      {
        book: "yirmeyahu",
        part: null,
        from: "32:6",
        to: "32:27",
      },
    ],
    ashkenaz: [
      {
        book: "yirmeyahu",
        part: null,
        from: "32:6",
        to: "32:27",
      },
    ],
  },
  "33": {
    weekday: [
      {
        from: "26:3",
        to: "26:5",
      },
      {
        from: "26:6",
        to: "26:9",
      },
      {
        from: "26:10",
        to: "26:13",
      },
    ],
    syrian: [
      {
        book: "yirmeyahu",
        part: null,
        from: "16:19",
        to: "17:14",
      },
    ],
    ashkenaz: [
      {
        book: "yirmeyahu",
        part: null,
        from: "16:19",
        to: "17:14",
      },
    ],
  },
  "34": {
    weekday: [
      {
        from: "1:1",
        to: "1:4",
      },
      {
        from: "1:5",
        to: "1:16",
      },
      {
        from: "1:17",
        to: "1:19",
      },
    ],
    syrian: [
      {
        book: "tere-asar",
        part: "hoshea",
        from: "2:1",
        to: "2:22",
      },
    ],
    ashkenaz: [
      {
        book: "tere-asar",
        part: "hoshea",
        from: "2:1",
        to: "2:22",
      },
    ],
  },
  "35": {
    weekday: [
      {
        from: "4:21",
        to: "4:24",
      },
      {
        from: "4:25",
        to: "4:28",
      },
      {
        from: "4:29",
        to: "4:33",
      },
    ],
    syrian: [
      {
        book: "shofetim",
        part: null,
        from: "13:2",
        to: "13:25",
      },
    ],
    ashkenaz: [
      {
        book: "shofetim",
        part: null,
        from: "13:2",
        to: "13:25",
      },
    ],
  },
  "36": {
    weekday: [
      {
        from: "8:1",
        to: "8:4",
      },
      {
        from: "8:5",
        to: "8:9",
      },
      {
        from: "8:10",
        to: "8:14",
      },
    ],
    syrian: [
      {
        book: "tere-asar",
        part: "zekharya",
        from: "2:14",
        to: "4:7",
      },
    ],
    ashkenaz: [
      {
        book: "tere-asar",
        part: "zekharya",
        from: "2:14",
        to: "4:7",
      },
    ],
  },
  "37": {
    weekday: [
      {
        from: "13:1",
        to: "13:3",
      },
      {
        from: "13:4",
        to: "13:16",
      },
      {
        from: "13:17",
        to: "13:20",
      },
    ],
    syrian: [
      {
        book: "yehoshua",
        part: null,
        from: "2:1",
        to: "2:24",
      },
    ],
    ashkenaz: [
      {
        book: "yehoshua",
        part: null,
        from: "2:1",
        to: "2:24",
      },
    ],
  },
  "38": {
    weekday: [
      {
        from: "16:1",
        to: "16:3",
      },
      {
        from: "16:4",
        to: "16:7",
      },
      {
        from: "16:8",
        to: "16:13",
      },
    ],
    syrian: [
      {
        book: "shemuel",
        part: "alef",
        from: "11:14",
        to: "12:22",
      },
    ],
    ashkenaz: [
      {
        book: "shemuel",
        part: "alef",
        from: "11:14",
        to: "12:22",
      },
    ],
  },
  "39": {
    weekday: [
      {
        from: "19:1",
        to: "19:6",
      },
      {
        from: "19:7",
        to: "19:9",
      },
      {
        from: "19:10",
        to: "19:17",
      },
    ],
    syrian: [
      {
        book: "shofetim",
        part: null,
        from: "11:1",
        to: "11:33",
      },
    ],
    ashkenaz: [
      {
        book: "shofetim",
        part: null,
        from: "11:1",
        to: "11:33",
      },
    ],
  },
  "40": {
    weekday: [
      {
        from: "22:2",
        to: "22:4",
      },
      {
        from: "22:5",
        to: "22:7",
      },
      {
        from: "22:8",
        to: "22:12",
      },
    ],
    syrian: [
      {
        book: "tere-asar",
        part: "mikha",
        from: "5:6",
        to: "6:8",
      },
    ],
    ashkenaz: [
      {
        book: "tere-asar",
        part: "mikha",
        from: "5:6",
        to: "6:8",
      },
    ],
  },
  "41": {
    weekday: [
      {
        from: "25:10",
        to: "25:12",
      },
      {
        from: "25:13",
        to: "25:15",
      },
      {
        from: "25:16",
        to: "26:4",
      },
    ],
    syrian: [
      {
        book: "melakhim",
        part: "alef",
        from: "18:46",
        to: "19:21",
      },
    ],
    ashkenaz: [
      {
        book: "melakhim",
        part: "alef",
        from: "18:46",
        to: "19:21",
      },
    ],
  },
  "42": {
    weekday: [
      {
        from: "30:2",
        to: "30:9",
      },
      {
        from: "30:10",
        to: "30:13",
      },
      {
        from: "30:14",
        to: "30:17",
      },
    ],
    syrian: [
      {
        book: "yirmeyahu",
        part: null,
        from: "1:1",
        to: "2:3",
      },
    ],
    ashkenaz: [
      {
        book: "yirmeyahu",
        part: null,
        from: "1:1",
        to: "2:3",
      },
    ],
  },
  "43": {
    weekday: [
      {
        from: "33:1",
        to: "33:3",
      },
      {
        from: "33:4",
        to: "33:6",
      },
      {
        from: "33:7",
        to: "33:10",
      },
    ],
    syrian: [
      {
        book: "yirmeyahu",
        part: null,
        from: "2:4",
        to: "2:28",
      },
      {
        book: "yirmeyahu",
        part: null,
        from: "4:1",
        to: "4:2",
      },
    ],
    ashkenaz: [
      {
        book: "yirmeyahu",
        part: null,
        from: "2:4",
        to: "2:28",
      },
      {
        book: "yirmeyahu",
        part: null,
        from: "3:4",
        to: "3:4",
      },
    ],
  },
  "44": {
    weekday: [
      {
        from: "1:1",
        to: "1:3",
      },
      {
        from: "1:4",
        to: "1:7",
      },
      {
        from: "1:8",
        to: "1:11",
      },
    ],
    syrian: [
      {
        book: "yeshayahu",
        part: null,
        from: "1:1",
        to: "1:27",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "1:1",
        to: "1:27",
      },
    ],
  },
  "45": {
    weekday: [
      {
        from: "3:23",
        to: "3:25",
      },
      {
        from: "3:26",
        to: "4:4",
      },
      {
        from: "4:5",
        to: "4:8",
      },
    ],
    syrian: [
      {
        book: "yeshayahu",
        part: null,
        from: "40:1",
        to: "40:26",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "40:1",
        to: "40:26",
      },
    ],
  },
  "46": {
    weekday: [
      {
        from: "7:12",
        to: "7:21",
      },
      {
        from: "7:22",
        to: "8:3",
      },
      {
        from: "8:4",
        to: "8:10",
      },
    ],
    syrian: [
      {
        book: "yeshayahu",
        part: null,
        from: "49:14",
        to: "51:3",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "49:14",
        to: "51:3",
      },
    ],
  },
  "47": {
    weekday: [
      {
        from: "11:26",
        to: "11:31",
      },
      {
        from: "11:32",
        to: "12:5",
      },
      {
        from: "12:6",
        to: "12:10",
      },
    ],
    syrian: [
      {
        book: "yeshayahu",
        part: null,
        from: "54:11",
        to: "55:5",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "54:11",
        to: "55:5",
      },
    ],
  },
  "48": {
    weekday: [
      {
        from: "16:18",
        to: "16:20",
      },
      {
        from: "16:21",
        to: "17:10",
      },
      {
        from: "17:11",
        to: "17:13",
      },
    ],
    syrian: [
      {
        book: "yeshayahu",
        part: null,
        from: "51:12",
        to: "52:12",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "51:12",
        to: "52:12",
      },
    ],
  },
  "49": {
    weekday: [
      {
        from: "21:10",
        to: "21:14",
      },
      {
        from: "21:15",
        to: "21:17",
      },
      {
        from: "21:18",
        to: "21:21",
      },
    ],
    syrian: [
      {
        book: "yeshayahu",
        part: null,
        from: "54:1",
        to: "54:10",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "54:1",
        to: "54:10",
      },
    ],
  },
  "50": {
    weekday: [
      {
        from: "26:1",
        to: "26:3",
      },
      {
        from: "26:4",
        to: "26:11",
      },
      {
        from: "26:12",
        to: "26:15",
      },
    ],
    syrian: [
      {
        book: "yeshayahu",
        part: null,
        from: "60:1",
        to: "60:22",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "60:1",
        to: "60:22",
      },
    ],
  },
  "51": {
    weekday: [
      {
        from: "29:9",
        to: "29:11",
      },
      {
        from: "29:12",
        to: "29:14",
      },
      {
        from: "29:15",
        to: "29:28",
      },
    ],
    syrian: [
      {
        book: "yeshayahu",
        part: null,
        from: "61:10",
        to: "63:9",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "61:10",
        to: "63:9",
      },
    ],
  },
  "52": {
    weekday: [
      {
        from: "31:1",
        to: "31:3",
      },
      {
        from: "31:4",
        to: "31:6",
      },
      {
        from: "31:7",
        to: "31:13",
      },
    ],
    syrian: [
      {
        book: "yeshayahu",
        part: null,
        from: "55:6",
        to: "56:8",
      },
    ],
    ashkenaz: [
      {
        book: "yeshayahu",
        part: null,
        from: "55:6",
        to: "56:8",
      },
    ],
  },
  "53": {
    weekday: [
      {
        from: "32:1",
        to: "32:3",
      },
      {
        from: "32:4",
        to: "32:6",
      },
      {
        from: "32:7",
        to: "32:12",
      },
    ],
    syrian: [
      {
        book: "shemuel",
        part: "bet",
        from: "22:1",
        to: "22:51",
      },
    ],
    ashkenaz: [
      {
        book: "shemuel",
        part: "bet",
        from: "22:1",
        to: "22:51",
      },
    ],
  },
  "54": {
    weekday: [
      {
        from: "33:1",
        to: "33:7",
      },
      {
        from: "33:8",
        to: "33:12",
      },
      {
        from: "33:13",
        to: "33:17",
      },
    ],
    syrian: [
      {
        book: "yehoshua",
        part: null,
        from: "1:1",
        to: "1:9",
      },
    ],
    ashkenaz: [
      {
        book: "yehoshua",
        part: null,
        from: "1:1",
        to: "1:18",
      },
    ],
  },
};
