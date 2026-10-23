// Common given names and surnames across India, the Gulf, Singapore and Malaysia, the UK and the
// US. A backstop for the name model: a capitalised word on these lists is treated as a name even
// when the model misses it. Names that are also everyday English words (Will, Grace, Hope, May,
// Mark, Joy) are left to the model, which reads the context.

const GIVEN = `
aarav aarti abhay abhijit abhinav abhishek aditi aditya ajay ajit akash akhil akshay alok aman amar amit amita amol amrita anand ananya anil anirudh anita anjali ankit ankita anoop anshul anup anupam anuradha anushka aparna archana arjun arnav arun aruna arvind asha ashish ashok ashwin atul avinash ayesha
balaji bhanu bharat bhavana bhavesh bhavna bindu chaitanya chandan chandra chetan chitra deepa deepak deepika devendra dhanush dhruv dinesh divya durga farhan gaurav gautam geeta girish gopal govind gurpreet hari harish harpreet harsh harsha hema hemant himanshu indira ishaan ishita jagdish jaideep jatin jayant jaya jitendra jyoti kabir kajal kalpana kamal kamala karan karthik kartik kavita kavitha kiran kishore krishna kunal lakshmi lalit lata madhav madhavi madhu mahesh manish manisha manoj meena meenakshi megha mehul mohan mohit monika mukesh murali nalini namita nandini naresh naveen navin neeraj neha nikhil nikita nilesh niraj nisha nitin nupur omkar padma pallavi pankaj parth pooja prabhu pradeep prakash pramod pranav prashant prateek praveen preeti prem priya priyanka puneet purnima rachna radha radhika raghav raghu rahul rajat rajeev rajendra rajesh rajiv rakesh ramesh rani ranjit rashmi ravi reena rekha renu rishi ritu rohan rohit roshan ruchi sachin sagar sahil sameer samir sandeep sandhya sangeeta sanjay sanjana santosh sapna sarita satish saurabh seema shalini shankar sharad shikha shilpa shirish shivani shreya shruti shubham siddharth smita sneha sonal soumya srinivas subhash suchitra sudha sudhir sujata sujit sumit sunil sunita supriya suraj suresh sushil swati tanvi tanya tarun tushar uday ujjwal uma umesh usha vaibhav vandana varun vasudha venkat venkatesh vidya vijay vikas vikram vinay vineet vinod vipin vishal vivek yamini yash yogesh yuvraj
aamir abdul abdulla abdullah adel adnan ahmad ahmed aisha alia amal amina amira anas arwa asma ayman bader basma bilal dalia dina eman fahad faisal fajr farah fatema fatima fatma ghada habib hadi hafsa hala hamad hamdan hamid hamza hana hanan hasan hassan hessa hind hiba hussain hussein ibrahim imran ismail jamal jamila jassim karim khadija khaled khalid khalifa latifa layla leila lina luay lulwa maha mahmoud majid manal mansoor mariam marwan maryam mohamed mohammad mohammed mona muhammad mustafa nabil nada nadia naji nasser nawal nayef noor noura nour omar osama qasim rania rashed rashid reem rima saad sabah saeed safa saif salem salim salma sami samira sara sarah shaikha shamma sultan tahir talal tamer tareq tariq usman waleed walid yasmin yasser yousef yousif youssef yusuf zainab zayed zaid ziad
ah aik beng boon chee cheng chia chin chong chun fang feng hao hock hong hui jia jian jie jin jun kai keng kian kok kwang lay li lian liang lin ling meng mei min ming peng ping qing rong shan sheng shu siew siong soon tian ting wai wee wei wen xin xiu yan yang yee yi ying yong yu yuan zhi zhen
nur siti nurul aziz azman faridah hafiz hakim haziq iskandar izzat kamarul norazlina rosli rozita shahrul suhaila syafiq syahirah zulkifli
aidan alastair alistair amelia angus annabel arthur aoife bethany bryony callum caoimhe cerys ciaran clodagh declan dougal eilidh eoin fergus fiona gareth gemma glyn hamish imogen isla jemima keira kirsty lachlan lewis lochlan morag niamh oisin orla pippa rhian rhiannon rhys ruaridh seamus sinead siobhan sorcha tamsin tristan
aaron abigail adam adrian alan albert alex alexander alexandra alice alicia allison amanda amy andrea andrew angela anna anthony antonio arianna ashley austin barbara benjamin beth brandon brenda brian brittany caleb cameron carlos carol caroline catherine charles charlotte chloe christina christine christopher cody colin connor courtney craig cynthia daniel danielle david deborah debra dennis derek diana diane donna dorothy douglas dylan edward elena elizabeth emily emma eric erin ethan eugene evelyn gabriel gary george gloria gregory hannah harold heather helen henry isaac isabella jacob james janet jason jeffrey jennifer jeremy jessica joan john jonathan jordan jose joseph joshua juan julia julie justin karen katherine kathleen kayla keith kelly kenneth kevin kimberly kyle laura lauren lawrence leah linda lisa logan lucas luis madison marcus margaret maria marie marilyn marissa martha matthew megan melissa michael michelle natalie nathan nicholas nicole noah olivia oliver pamela patricia patrick paul peter philip rachel rebecca richard robert ronald ryan samantha samuel sandra scott sean sharon shirley sophia stephanie stephen steven susan teresa thomas timothy tom tyler valerie victoria vincent walter william zachary
`;

const SURNAMES = `
agarwal agrawal ahluwalia ahuja arora bajaj banerjee basu batra bhalla bhandari bhatia bhatt bose chakraborty chatterjee chaudhary chauhan chawla chopra das dasgupta desai deshmukh deshpande dhillon dixit dubey dutta gandhi ghosh gill goel goswami grover gupta iyengar iyer jain jha joshi kapoor kaur khanna khurana kohli krishnamurthy kulkarni kumar malhotra mehra mehta menon mishra mukherjee murthy naidu nair narayan narayanan pandey patel patil pillai prasad raghavan rajan ramachandran raman ranganathan rao rastogi reddy saxena sen sengupta sethi shah sharma shetty shukla singh sinha srinivasan subramanian sundaram suri talwar thakur tiwari trivedi varma verma yadav
abdulrahman alali alhashimi almansoori almazrouei alnahyan alqasimi alsuwaidi alzaabi alfalasi alshamsi alketbi alnuaimi alharthy alghamdi alotaibi alqahtani alsaud haddad khoury mansour nasser saleh
chan cheong chew chia chng chong chua foo goh heng ho hong koh kwek lau lee leong lim loh low ng ong poh quek seah sim soh tan tay teo toh wee wong yap yeo
`;

/**
 * Names that are also everyday words, places, festivals or abbreviations ("Will", "Jordan",
 * "Hong Kong", "Hari Raya", "Jun 2026"). These are left to the model unless they sit next to
 * another name.
 */
const COLLIDES = new Set([
  "will", "may", "june", "april", "mark", "bill", "grace", "hope", "joy", "faith", "rose", "sunny", "rich", "chase",
  "hunter", "pat", "sue", "max", "jack", "dawn", "summer", "ray", "guy", "don", "art", "dev", "ram", "jay", "ash", "ben",
  "sam", "kim", "long", "young", "price", "page", "austin", "jordan", "victoria", "madison", "sabah", "hari", "durga",
  "fajr", "zayed", "hong", "jun", "min", "soon", "sim", "ping", "chin", "low", "ho", "ah", "boon", "fang", "lay", "yu",
]);

const toSet = (list: string) => new Set(list.split(/\s+/).filter(Boolean));
const GIVEN_NAMES = toSet(GIVEN);
const SURNAME_SET = toSet(SURNAMES);

/** Names that may be matched even in lowercase: distinctive, four letters or more, not English words. */
function matchesLowercase(word: string): boolean {
  return word.length >= 4 && !COLLIDES.has(word) && (GIVEN_NAMES.has(word) || SURNAME_SET.has(word));
}

/**
 * Spans of words that are on the name lists. Capitalised words match any listed name except the
 * English collisions; Chinese and Malay syllables and short names match only when capitalised.
 */
export function dictionarySpans(text: string): [number, number][] {
  const spans: [number, number][] = [];
  for (const m of text.matchAll(/[\p{L}][\p{L}'’-]*/gu)) {
    const word = m[0].replace(/['’]s$/, "");
    const lower = word.toLowerCase();
    const listed = GIVEN_NAMES.has(lower) || SURNAME_SET.has(lower);
    if (!listed) continue;
    const capitalised = /^\p{Lu}/u.test(word);
    const ok = capitalised ? !COLLIDES.has(lower) || isMidSentenceName(text, m.index!, word) : matchesLowercase(lower);
    if (ok) spans.push([m.index!, m.index! + word.length]);
  }
  return spans;
}

/** A colliding name ("Lee", "Tan") counts when it sits next to another capitalised name word. */
function isMidSentenceName(text: string, at: number, word: string): boolean {
  const before = text.slice(Math.max(0, at - 30), at).match(/(\p{Lu}[\p{L}'’-]+)\s+$/u)?.[1]?.toLowerCase();
  const after = text.slice(at + word.length, at + word.length + 30).match(/^\s+(\p{Lu}[\p{L}'’-]+)/u)?.[1]?.toLowerCase();
  const isName = (w?: string) => !!w && (GIVEN_NAMES.has(w) || SURNAME_SET.has(w));
  return isName(before) || isName(after);
}
