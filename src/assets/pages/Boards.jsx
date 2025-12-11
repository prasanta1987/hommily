import { useEffect, useState } from 'react';
import { Card, Button, Dropdown, DropdownButton, Badge } from 'react-bootstrap'

export default function Boards(props) {

    // console.log(props.boardData);

    const onBoardSelect = (devCode, devFeed) => {
        props.sendSelectedBoard(devCode, devFeed);
    };

    return (
        props.boardData.hasOwnProperty("name")
            ?
            <>
                <DropdownButton id="dropdown-item-button" title={props.boardData.name}>
                    <Dropdown.ItemText><b>{props.boardData.name}:</b> Feeds</Dropdown.ItemText>
                    {(props.boardData.devFeeds) &&
                        Object.keys(props.boardData.devFeeds).map(devFeed => {
                            return (
                                <Dropdown.Item className="d-flex justify-content-between"
                                    key={devFeed} 
                                    onClick={() =>onBoardSelect(props.boardData.deviceCode,devFeed)}>
                                    <span>{devFeed}</span>
                                    <Badge>{props.boardData.devFeeds[devFeed]}</Badge>
                                </Dropdown.Item>
                            )
                        })
                    }
                </DropdownButton>
            </>
            : <p>BLANK</p>
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