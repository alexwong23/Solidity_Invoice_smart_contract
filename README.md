# Smart Contracts

a truffle project for ACCESS Voting smart contracts

## Voter Code Manager

Hashed codes, from a JSON file, are stored in the smart contract when deployed. A status is tied to each code, to ensure it can only be used once. There are three statuses, valid, used and invalid.

This smart contract manages the status of the hashed codes, and user permissions.
- Only the owner is allowed to add codes
- Only the voting machine is allowed to use a code
- Only the admin is allowed to invalidate codes

In the event of a tie break, another round of voting will occur. Results of the previous vote will be displayed.

modifier onlyVotingMachine
modifier onlyAdmin
modifier onlyOwner

function addCodes onlyOwner
function checkCode
function useCode onlyVotingMachine
function invalidateCode onlyAdmin
function startTieBreaker
function getActiveVotingMachine

## Voting Machine

The positions, its available seats, its candidates and votes for each candidate are recorded in this smart contract. There are four voting states, not initialised, running (no votes submitted), running (votes submitted), and terminated.

This smart contract manages the positions, seats and candidates. It also stores and counts votes, and manages user permissions.
- Before votes are submitted, only the admin is allowed to add positions and replace candidates.
- Only a voting machine is allowed to submit a vote.
- Only the admin is allowed to terminate and start the voting process
- Votes can only be counted when the voting process is not running.

modifier onlyAdmin
modifier onlyVotingApp
modifier isValidPosition
modifier areValidPositions
modifier onlyWhenRunning
modifier onlyNotRunning
modifier voteNotStarted

function init onlyAdmin
function addPositions onlyAdmin voteNotStarted
function replaceCandidates onlyAdmin voteNotStarted isValidPosition
function getPositions
function getCandidates isValidPosition
function vote onlyWhenRunning onlyVotingApp areValidPositions
function checkVoteStarted
function getStatus
function terminate onlyAdmin
function start onlyAdmin
function getVoteCount onlyNotRunning

## Test cases

To Run tests:
1. ganache-cli <<in another tab>>
2. copy public addresses into address.json
3. truffle test

#### Test cases for Manager

'check code status is valid before use'
'update code to invalid only admin'
'update code to invalid success'
'use code only voting machine'
'admin start tiebreaker change active voting machine'
'invalidated code is still invalid in tiebreaker'

#### Test cases for Machine

'init error if argument lengths not similar'
'init error if run twice'
'get Candidate position index argument'
'get Candidate return success'
'replace candidates only admin'
'replace Candidates position index argument'
'replace Candidates in the existing list'
'add positions only admin'
'add Positions error if argument lengths not similar'
'add Positions to the existing list'
'get Positions return success'
'terminate only admin'
'terminate success and start only admin'
'vote only voting app'
'vote only when running'
'vote only valid positions'
'vote only if code valid'
'vote code can only be used once'
'vote only if arguments of same length'
'vote cannot exceed available seats'
'vote argument must have same length as number of candidates'
'get count vote only when not running'
'get count vote success'
'add positions only when vote not started'
'terminate success after vote start'
# Solidity_Invoice_smart_contract
# Solidity_Invoice_smart_contract
