import AuthAxios from "@/api/authAxios";
import { STATE_BOX } from "@/constants/state";
import { theme } from "@/styles/theme";
import React, { useEffect, useState } from "react";
import styled, { css } from "styled-components";
import StateBox from "./StateBox";
import { useRouter } from "next/navigation";
import { ReportList } from "@/app/report/page";

interface TableProps {
  tableType: "report" | "user";
  list: any[];
  updateReportList?: (updatedReport: ReportList) => void;
}

const Table: React.FC<TableProps> = ({ tableType, list, updateReportList }) => {
  const router = useRouter();
  const [more, setMore] = useState(false);
  const [detailData, setDetailData] = useState<ReportList>();
  const [state, setState] = useState<string>("");

  const handleMoreModal = (id: number) => async () => {
    if (tableType === "report") {
      try {
        const response = await AuthAxios.get(`/api/v1/admin/reports/${id}`);
        console.log("상세 정보 조회 성공", response.data.result);
        setDetailData(response.data.result);
        setMore(true);
        setState(response.data.result.action);
      } catch (error) {
        console.error("상세 정보 조회 실패", error);
      }
    } else {
      return;
    }
  };

  const handleShowChat = (userSid: string) => async () => {
    try {
      const response = await AuthAxios.get(
        `/api/v1/admin/chats/${userSid}/rented-rooms`
      );
      setDetailData(response.data.result);
      setMore(false);

      const width = 480; // 팝업 너비
      const height = 800; // 팝업 높이

      // 화면 중앙에 위치 계산
      const left = screen.width / 2 - width / 2;
      const top = screen.height / 2 - height / 2;

      window.open(
        `/chat?userSid=${userSid}`, // 채팅 페이지 URL
        "_blank", // 새로운 탭이나 창으로 열기
        `width=${width},height=${height},top=${top},left=${left}` // 중앙에 위치시키기 위한 설정
      );
    } catch (error) {
      console.error("채팅 정보 조회 실패", error);
    }
  };

  const handleChangeState = (box: string) => () => {
    if (state !== box) {
      setState(box);
    } else {
      setState("");
    }
  };

  const handleSave = (reportId: number) => async () => {
    try {
      const response = await AuthAxios.post(
        `/api/v1/admin/reports/${reportId}`,
        {
          action: state,
        }
      );

      console.log("상태 변경 성공", response);
      setMore(false);

      if (updateReportList && detailData) {
        const updatedDetailData = {
          ...detailData,
          state: "ACTIONED",
          action: state,
        };
        updateReportList(updatedDetailData);
        console.log(detailData);
      }
    } catch (error) {
      console.error("상태 변경 실패", error);
    }
  };

  const columns =
    tableType === "report"
      ? [
          "번호",
          "신고대상 ID",
          "신고사유",
          "내용",
          "옷장 점수",
          "처리 상태",
          "거래 중 여부",
          "상태 변경",
        ]
      : [
          "이름",
          "닉네임",
          "이메일",
          "전화번호",
          "옷장 점수",
          "매너 키워드 횟수\n(긍정 / 부정)",
          "거래 건수",
          "이용제한",
        ];

  return (
    <>
      {list.length > 0 ? (
        <>
          <TableWrapper>
            <TableDiv>
              <thead>
                <tr>
                  {columns.map((column, index) => (
                    <Th key={index}>{column}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((item, index) => (
                  <Tr key={index} onClick={handleMoreModal(item.id)}>
                    {tableType === "report" ? (
                      <>
                        <Td>{item.id}</Td>
                        <Td>{item.reporteeNickname}</Td>
                        <Td>{item.reason}</Td>
                        <Td $summary={true}>{item.content}</Td>
                        <Td>{item.closetScore}</Td>
                        <Td>
                          {item.state === "PENDING" ? "접수 완료" : "처리 완료"}
                        </Td>
                        <Td>{item.isRented ? "거래 중" : "-"}</Td>

                        <Td>
                          {item.action === null ? (
                            <ButtonWrapper>
                              <Button>조치 선택</Button>
                            </ButtonWrapper>
                          ) : item.action === "RESTRICTED" ? (
                            "이용 제한"
                          ) : item.action === "DOCKED" ? (
                            "점수 삭감"
                          ) : item.action === "SUSPENDED" ? (
                            "유예"
                          ) : (
                            "무시"
                          )}
                        </Td>
                      </>
                    ) : (
                      <>
                        <Td>{item.name}</Td>
                        <Td>{item.nickname}</Td>
                        <Td>{item.email}</Td>
                        <Td>{item.phoneNumber}</Td>
                        <Td>{item.closetScore}</Td>
                        <Td>
                          {" "}
                          {item.positiveKeywordCount} /{" "}
                          {item.negativeKeywordCount}{" "}
                        </Td>
                        <Td>{item.rentalCount}</Td>
                        <Td>
                          {item.isRestricted
                            ? "제한됨"
                            : item.isSuspended
                            ? "유예"
                            : "정상"}
                        </Td>
                      </>
                    )}
                  </Tr>
                ))}
              </tbody>
            </TableDiv>
          </TableWrapper>
          {more && detailData && (
            <ModalOverlay>
              <Modal>
                <Title>신고 내역 조회</Title>
                <ModalContent>
                  <DetailRow>
                    <DetailLabel>신고 글 번호</DetailLabel>{" "}
                    <DetailValue>{detailData.id}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>신고대상 ID</DetailLabel>{" "}
                    <DetailValue>
                      {detailData.reporteeNickname} ({detailData.reporteeEmail})
                    </DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>작성자 ID</DetailLabel>{" "}
                    <DetailValue>
                      {detailData.reporterNickname} ({detailData.reporterEmail})
                    </DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>신고사유</DetailLabel>{" "}
                    <DetailValue>{detailData.reason}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>내용</DetailLabel>{" "}
                    <DetailValue>{detailData.content}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>옷장 점수</DetailLabel>{" "}
                    <DetailValue>{detailData.closetScore}점</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>처리 상태</DetailLabel>{" "}
                    <DetailValue>
                      {detailData.state === "PENDING"
                        ? "접수 완료"
                        : "처리 완료"}
                    </DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>현재 거래</DetailLabel>{" "}
                    <DetailValue>
                      {detailData.isRented ? "거래 중" : "거래 없음"}
                    </DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>채팅 내역 보기</DetailLabel>{" "}
                    <DetailValue>
                      {detailData.userSid && (
                        <ChatButton
                          onClick={handleShowChat(detailData.userSid)}
                          disabled={!detailData.isRented}
                        >
                          보기
                        </ChatButton>
                      )}
                    </DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>상태 변경</DetailLabel>{" "}
                    <DetailValue>
                      <StateBoxList>
                        {STATE_BOX.map((item) => (
                          <StateBox
                            key={item.id}
                            text={item.text}
                            check={item.state === state}
                            onClick={handleChangeState(item.state)}
                          />
                        ))}
                      </StateBoxList>
                    </DetailValue>
                  </DetailRow>
                </ModalContent>
                <ButtonModal>
                  <CloseButton onClick={() => setMore(false)}>닫기</CloseButton>
                  <CloseButton
                    onClick={handleSave(detailData.id)}
                    disabled={detailData.action === state || state == ""}
                  >
                    적용하기
                  </CloseButton>
                </ButtonModal>
              </Modal>
            </ModalOverlay>
          )}
        </>
      ) : (
        <NoData> 결과가 없습니다.</NoData>
      )}
    </>
  );
};

export default Table;

const TableWrapper = styled.div`
  width: 100%;
  flex-shrink: 0;
  border-radius: 10px;
  padding: 0px;
  border: 1px solid ${theme.colors.purple500};
  background: ${theme.colors.white};
  overflow: hidden;
`;

const TableDiv = styled.table`
  width: 100%;
  height: 100%;
  border-collapse: collapse;
  border-radius: 10px;
  border: none;
  padding: 0 25px;
  background: ${theme.colors.white};
`;

const Th = styled.th`
  padding: 10px;
  background-color: ${({ theme }) => theme.colors.purple100};
  color: ${({ theme }) => theme.colors.black};
  text-align: center;
  border-bottom: 2px solid ${({ theme }) => theme.colors.purple500};
  padding: 15px 25px;
  white-space: nowrap;
`;

const Tr = styled.tr`
  &:hover {
    background: ${theme.colors.purple50};
  }
`;

const Td = styled.td<{ $summary?: boolean }>`
  padding: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray300};
  text-align: center;
  white-space: nowrap;
  color: ${theme.colors.b100};
  ${(props) => props.theme.fonts.b2_regular};

  ${({ $summary }) =>
    $summary &&
    css`
      max-width: 200px;
      text-overflow: ellipsis;
      overflow: hidden;
      word-wrap: break-word;
    `}
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
`;

const Button = styled.button`
  width: 81px;
  height: 31px;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #d9d9d9;
  background: #fcfcfc;
  color: ${theme.colors.b100};
  ${(props) => props.theme.fonts.b2_regular};
`;

const ModalOverlay = styled.div`
  width: 100%;
  height: 100%;
  position: fixed;
  background-color: rgba(0, 0, 0, 0.5);
  top: 0;
  left: 0;
`;

const Modal = styled.div`
  width: 600px;
  height: 630px;
  padding: 58px 55px;
  border-radius: 40px;
  background: #fff;
  box-shadow: 4px 4px 30px 3px rgba(185, 185, 185, 0.25);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

const Title = styled.h2`
  width: 100%;
  text-align: center;
  font-size: 24px;
  margin-bottom: 38px;
  color: ${theme.colors.black};
`;

const DetailRow = styled.div`
  display: flex;
  margin-bottom: 16px;
  grid-template-columns: 1fr 3fr;
`;

const DetailLabel = styled.div`
  width: 150px;
  font-weight: bold;
  margin-right: 10px;
  color: #231e5c;
`;

const DetailValue = styled.div`
  width: 100%;
  color: ${theme.colors.b100};
`;

const ChatButton = styled.button`
  color: ${theme.colors.purple300};
  ${(props) => props.theme.fonts.b2_regular};

  &:hover {
    text-decoration: underline;
  }

  &:disabled {
    color: ${theme.colors.gray800};
  }
`;

const StateBoxList = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ButtonModal = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
`;

const CloseButton = styled.button`
  height: 39px;
  align-self: flex-end;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background: ${theme.colors.purple500};
  ${(props) => props.theme.fonts.b2_medium};
  color: ${theme.colors.white};
  font-size: 16px;
  transition: color 200ms, background-color 200ms;
  cursor: pointer;

  &:hover {
    background: ${theme.colors.purple400};
  }

  &:disabled {
    background-color: ${theme.colors.gray300};
  }
`;

const NoData = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${theme.colors.gray500};
  font-size: 24px;
  ${(props) => props.theme.fonts.b2_regular};
`;
