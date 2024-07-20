const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
app.use(cors());

const typeDefs = `
  type Contest {
    contestName: String!
    rank: Int!
    oldRating: Int!
    newRating: Int!
  }

  type Problem {
    contestId: Int!
    index: String!
    points: Float
    rating: Int
    tags: [String!]!
  }

  type Submission {
    problem: Problem!
    verdict: String!
  }

  type UserRatingResponse {
    result: [Contest!]!
  }

  type UserStatusResponse {
    result: [Submission!]!
  }

  type ProcessedRatingData {
    combinedLabels: [String!]!
    ratings: [Int!]!
  }

  type ProcessedStatusData {
    countMap: JSON!
    sortedEntries: [[String!]!]!
    tagKeysSorted: [String!]!
    tagValues: [Int!]!
    tagKeys: [String!]!
    labels: [String!]!
    counts: [Int!]!
    unsolvedQuestionId: [String!]!
    unsolvedContestQuestion: [String!]!
    unsolvedContestId: [Int!]!
  }

  type Query {
    userRating(handle: String!): UserRatingResponse
    userStatus(handle: String!): UserStatusResponse
    processedUserRating(handle: String!): ProcessedRatingData
    processedUserStatus(handle: String!): ProcessedStatusData
  }

  scalar JSON
`;

const resolvers = {
  Query: {
    userRating: async (_, { handle }) => {
      const profileURL = `https://codeforces.com/api/user.rating?handle=${handle}`;
      return await fetchData(profileURL);
    },
    userStatus: async (_, { handle }) => {
      const statusURL = `https://codeforces.com/api/user.status?handle=${handle}`;
      return await fetchData(statusURL);
    },
    processedUserRating: async (_, { handle }) => {
      return await processData(handle);
    },
    processedUserStatus: async (_, { handle }) => {
      // const startTime = process.hrtime();
      const result = await userStatus(handle);
      // const endTime = process.hrtime(startTime);
      // const executionTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds
      
      // console.log(`GraphQL execution time: ${executionTime.toFixed(2)} ms`);
      return result;
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const server = new ApolloServer({ schema });

/****************************/
const fetchData = async (URL) => {
    try {
      const response = await fetch(URL);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
};


const processData = async (user) => {
    const profileURL = `https://codeforces.com/api/user.rating?handle=${user}`;
    try {
      const data = await fetchData(profileURL);
      const contestData = data.result;
  
      const ranks = contestData.map((contest) => contest.rank);
      const names = contestData.map((contest) => contest.contestName);
      const ratingChange = contestData.map((contest) => contest.newRating - contest.oldRating);
      const ratings = contestData.map((contest) => contest.newRating);

      const combinedLabels = names.map((name, index) => {
        const ratingChangeValue = ratingChange[index];
        return ratingChangeValue > 0 ? `+(${ratingChangeValue}) ${name}` : `(${ratingChangeValue}) ${name}`;
      });

      return { combinedLabels, ratings };
    } catch (error) {
      console.error('Error processing data:', error);
    }
};



const userStatus = async (user) => {
    const userStatusURL = `https://codeforces.com/api/user.status?handle=${user}`;
    try {
      const data = await fetchData(userStatusURL);
      const results = data.result;
      const problems = results.filter(res => res.verdict === "OK").map(res => res.problem);
      const unsolvedProblems = results
        .filter(res => res.verdict !== "OK")
        .map(res => res.problem)
        .filter(prob => prob.hasOwnProperty('rating'));
      const ratedProblems = problems.filter(prob => prob.hasOwnProperty('rating'));
  
      const uniqueProblemsMap = new Map();
      ratedProblems.forEach(prob => {
        const key = `${prob.contestId}-${prob.index}`; 
        if (!uniqueProblemsMap.has(key)) {
          uniqueProblemsMap.set(key, prob);
        }
      });
  
      const uniqueUnsolvedProblemsMap = new Map();
      const uniqueUnsolvedProblemsContestQuestionMap = new Map();
      unsolvedProblems.forEach(prob => {
        const key = `${prob.contestId}-${prob.index}`;
        if (!uniqueUnsolvedProblemsMap.has(key) && !uniqueProblemsMap.has(key)) {
          uniqueUnsolvedProblemsMap.set(key, prob);
          if (uniqueUnsolvedProblemsContestQuestionMap.has(prob.contestId)) {
            uniqueUnsolvedProblemsContestQuestionMap.get(prob.contestId).push(prob.index);
          } else {
            uniqueUnsolvedProblemsContestQuestionMap.set(prob.contestId, [prob.index]);
          }
        }
      });
  
      const unsolvedContestId = [];
      const unsolvedQuestionId = [];
  
      uniqueUnsolvedProblemsContestQuestionMap.forEach((indices, contestId) => {
        const len = indices.length;
        for (let i = 0; i < len; i++) unsolvedContestId.push(contestId);
        unsolvedQuestionId.push(...indices);
      });
  
      const unsolvedContestQuestion = Array.from(uniqueUnsolvedProblemsMap.keys());
  
      const uniqueProblems = Array.from(uniqueProblemsMap.values());
      const levels = uniqueProblems.map((prob) => prob.rating);
  
      const tagMap = new Map();
      const tags = uniqueProblems.map(prob => prob.tags);
  
      tags.forEach(tagArr => {
        tagArr.forEach(tagEle => {
          if (!tagMap.has(tagEle)) {
            tagMap.set(tagEle, 1);
          } else {
            tagMap.set(tagEle, tagMap.get(tagEle) + 1);
          }
        });
      });

      const countMap = levels.reduce((acc, value) => {
        acc[value] = acc[value] ? acc[value] + 1 : 1;
        return acc;
      }, {});

      const sortedEntries = Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]);

      const tagKeysSorted = sortedEntries.map(entry => entry[0]);
      const tagValues = sortedEntries.map(entry => entry[1]);

      const tagKeys = tagKeysSorted.map((val,ind) => `${val}: ${tagValues[ind]}`)
  
      const labels = Object.keys(countMap);
      const counts = Object.values(countMap);
  
    return { countMap, sortedEntries, tagKeysSorted, tagValues, tagKeys, labels, counts, unsolvedQuestionId, unsolvedContestQuestion, unsolvedContestId };
    } catch (error) {
      console.log("Error processing user info data", error);
    }
};


async function startServer() {
  await server.start();

  // Apply the Apollo GraphQL middleware and set the path to /graphql
  app.use(
    '/graphql',
    cors(),
    bodyParser.json(),
    expressMiddleware(server),
  );

  // Keep your existing REST endpoints
  app.get('/user/rating/:handle', async (req, res) => {
    const userHandle = req.params.handle;
    try {
      const data = await processData(userHandle);
      res.json(data);
    } catch (error) {
      res.status(500).send('Error fetching user rating data');
    }
  });
    
  app.get('/user/status/:handle', async (req, res) => {
    const userHandle = req.params.handle;
    // const startTime = process.hrtime();
    try {
      const data = await userStatus(userHandle);
      // const endTime = process.hrtime(startTime);
      // const executionTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds

      // const payloadSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
    
      // console.log(`REST API execution time: ${executionTime.toFixed(2)} ms`);
      // console.log(`REST API payload size: ${payloadSize} bytes`);
      res.json(data);
    } catch (error) {
      res.status(500).send('Error fetching user status data');
    }
  });

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
}

startServer();