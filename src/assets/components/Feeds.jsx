import { useEffect, useState } from 'react';
import { Card, Button, Dropdown, DropdownButton, Badge } from 'react-bootstrap'

export default function Feeds(props) {

    const feedData = props.feedsData;

    // const onBoardSelect = (devCode, devFeed) => {
    //     props.sendSelectedBoard(devCode, devFeed);
    // };

    return (
        <>
            {
                Object.keys(feedData).map(feed => {
                    if (feedData[feed].isSelected) {
                        return (
                            <Card>
                                <Card.Body>
                                    <Card.Title>{feed}</Card.Title>
                                    <Card.Text>
                                        {feedData[feed].value}
                                    </Card.Text>
                                </Card.Body>
                            </Card >
                        )
                    }
                })
            }
        </>
    );
}

{/* <Card style={{ width: '8rem' }}>
<Card.Img variant="top" style={{ width: "100%" }} src="../../mcu.svg" />
<Card.Body>
    <Card.Title>{props.boardData.name}</Card.Title>
    <Card.Text>
    {props.boardData.deviceCode}
    </Card.Text>
    <Button onClick={()=>onBoardSelect(props.boardData.deviceCode)} variant="primary">Select</Button>
</Card.Body>
</Card> */}

