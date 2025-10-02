import { CircleText } from "circle-text-library"

export const circleTextLibrary = new CircleText({
    keywordConfig: {
        minWordLength: 3,
        maxKeywords: 30,
        stopwords: [],
        boostFirstSentences: true,
    },
    sentimentConfig: {
        customStopwords: [],
        boostWordsList: [],
    },
})
