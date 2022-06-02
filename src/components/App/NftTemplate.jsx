export default function NftTemplate({
    lockDate,
    lockDuration, // TODO change to end date and calculate the new date
    wrappedSymbol,
    wrappedAmount
}) {
    const day = lockDate.getDate();
    const month = lockDate.getMonth() + 1; // getMonth() returns month from 0 to 11
    const year = lockDate.getFullYear();

    const lockDateString = `${year}-${month}-${day}`;

    return (
        /* eslint-disable */
        <svg className="nftTemplate" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
        
        <linearGradient id="linear-gradient" x1="0" y1="500" x2="250" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#bdbec5" />
            <stop offset="0.5" stop-color="#547181" />
            <stop offset="1" stop-color="#4b4c4e" />
        </linearGradient>
        <rect className="background" width="400" height="500" rx="20" />
        <g transform="translate(0,50)">
            <g>
                <linearGradient y1="50" x2="350" y2="50" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#bdbec5" />
                    <stop offset="1" stop-color="#4b4c4e" />
                </linearGradient>
                <rect className="gradient-border" x="50" y="10" width="300" height="100" rx="20" transform="translate(0,0)" />
                <text text-anchor="end" className="amount-text" x="345" y="70">{wrappedAmount}</text>
                <text text-anchor="middle" className="date-label" x="200" y="100">{wrappedSymbol}</text>
            </g>
            <g>
                <linearGradient y1="50" x2="350" y2="50" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#bdbec5" />
                    <stop offset="1" stop-color="#4b4c4e" />
                </linearGradient>
                <rect className="gradient-border" x="75" y="120" width="250" height="90" rx="20" transform="translate(0,0)" />
                <text text-anchor="middle" className="date-text" x="200" y="165">{lockDuration}</text>
                <text text-anchor="middle" className="date-label" x="200" y="200">Lock Duration</text>
                <rect className="gradient-border" x="75" y="220" width="250" height="90" rx="20" transform="translate(0,0)" />
                <text text-anchor="middle" className="date-text" x="200" y="265">{lockDateString}</text>
                <text text-anchor="middle" className="date-label" x="200" y="300">Lock Date </text>
            </g>
        </g>
        <g transform="translate(10,420)">
            <path className="snowflake-logo" d="M19.41,5.77l-3.47,4.89L12.46,5.77,15.94,0ZM7.54,7.53l1.2,4.88,4.41.74-.74-4.41ZM0,15.93l5.77,3.48,4.89-3.48L5.77,12.45Zm7.53,8.4,      4.88-1.2.74-4.42-4.41.75Zm8.4,7.54,3.48-5.77-3.48-4.89L12.45,26.1Zm8.4-7.53-1.2-4.88-4.42-.74.75,4.41Zm7.54-8.4L26.1,      12.46l-4.89,3.48,4.89,3.47Zm-7.53-8.4-4.88,1.2-.74,4.41,4.41-.74Z" />
            <text className="logo-text" x="40" y="25">TRUE FREEZE</text>
        </g>
    </svg>
    )
};