import { useEffect, useState } from 'react';
import { FiZap, FiCpu, FiClock } from 'react-icons/fi';
import '../css/Feeds.css';

// Helper function to format timestamp
const formatTimestamp = (dateValue) => {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
        return 'Invalid time';
    }
    return new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
        timeZone: 'Asia/Kolkata',
    }).format(date);
};


const FeedCard = ({ feed, boardName, feedName }) => {
    if (!feed) return null;

    // Use the timestamp from the feed data, assuming it has a 'time' property
    const dbTimestamp = feed.time ? feed.time : null;

    return (
        <div className="feed-card">
            <div className="feed-card-header">
                <FiZap className="feed-icon" />
                <span className="feed-name">{feedName}</span>
            </div>
            <div className="feed-card-body">
                <div className="feed-value">{feed.value}</div>
            </div>
            <div className="feed-card-footer">
                <div className="feed-board-info">
                    <FiCpu className="board-icon" />
                    <span>{boardName}</span>
                </div>
                <div className="feed-timestamp">
                    <FiClock className="board-icon" />
                    {dbTimestamp ? formatTimestamp(dbTimestamp) : 'No timestamp'}
                </div>
            </div>
        </div>
    );
};

export default function Feeds(props) {
    const [selectedFeeds, setSelectedFeeds] = useState([]);

    useEffect(() => {
        if (props.feedData) {
            const allBoards = Object.values(props.feedData);
            const feeds = allBoards.flatMap(board => {
                if (board.devFeeds) {
                    return Object.keys(board.devFeeds)
                        .filter(feedName => board.devFeeds[feedName].isSelected)
                        .map(feedName => ({
                            ...board.devFeeds[feedName],
                            boardName: board.name,
                            feedName: feedName,
                            id: `${board.deviceCode}-${feedName}`
                        }));
                }
                return [];
            });
            setSelectedFeeds(feeds);
        } else {
            setSelectedFeeds([]);
        }
    }, [props.feedData]);

    if (selectedFeeds.length === 0) {
        return (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
                <h2>No Feeds Selected</h2>
                <p>Please select a feed from a board to see its data.</p>
            </div>
        );
    }

    return (
        <div className="feeds-grid">
            {selectedFeeds.map(feed => (
                <FeedCard key={feed.id} feed={feed} boardName={feed.boardName} feedName={feed.feedName} />
            ))}
        </div>
    );
}
